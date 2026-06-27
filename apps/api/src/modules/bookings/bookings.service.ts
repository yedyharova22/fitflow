import type {
  BookingListInput,
  BookingListResponse,
  BookingResponse,
  CreateBookingInput,
  UpdateBookingStatusInput,
} from '@fitflow/shared';
import { NotificationType } from '@fitflow/shared';
import { UserRole, Prisma } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { notifyUser } from '../../lib/notification-jobs.js';
import { prisma } from '../../lib/prisma.js';
import { bookingsRepository } from './bookings.repository.js';

function toBookingResponse(
  booking: NonNullable<Awaited<ReturnType<typeof bookingsRepository.findById>>>,
): BookingResponse {
  return {
    id: booking.id,
    status: booking.status,
    attendedAt: booking.attendedAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    client: {
      id: booking.client.id,
      name: booking.client.profile?.name ?? 'Client',
      email: booking.client.email,
    },
    instance: {
      id: booking.workoutInstance.id,
      scheduledAt: booking.workoutInstance.scheduledAt.toISOString(),
      workoutId: booking.workoutInstance.workoutId,
      workoutTitle: booking.workoutInstance.workout.title,
    },
  };
}

export class BookingsService {
  async create(clientId: string, role: UserRole, input: CreateBookingInput): Promise<BookingResponse> {
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenError('Only clients can create bookings');
    }

    const instance = await prisma.workoutInstance.findUnique({
      where: { id: input.workoutInstanceId },
      include: { workout: true },
    });

    if (!instance || instance.status !== 'SCHEDULED' || !instance.workout.isActive) {
      throw new NotFoundError('Workout session not available');
    }

    if (instance.scheduledAt < new Date()) {
      throw new ValidationError('Cannot book a past session');
    }

    if (instance.workout.maxCapacity != null) {
      const count = await bookingsRepository.countApprovedForInstance(instance.id);
      if (count >= instance.workout.maxCapacity) {
        throw new ConflictError('This session is full');
      }
    }

    try {
      const booking = await bookingsRepository.create({
        clientId,
        workoutInstanceId: input.workoutInstanceId,
      });

      notifyUser({
        userId: instance.workout.coachId,
        type: NotificationType.BOOKING_REQUEST,
        entityId: booking.id,
        payload: {
          bookingId: booking.id,
          clientName: booking.client.profile?.name ?? 'Client',
          workoutTitle: booking.workoutInstance.workout.title,
          scheduledAt: booking.workoutInstance.scheduledAt.toISOString(),
        },
      });

      return toBookingResponse(booking);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('You already booked this session');
      }
      throw err;
    }
  }

  async list(userId: string, role: UserRole, query: BookingListInput): Promise<BookingListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result =
      role === UserRole.COACH
        ? await bookingsRepository.listForCoach(
            userId,
            { status: query.status, clientId: query.clientId },
            page,
            pageSize,
          )
        : await bookingsRepository.listForClient(userId, query.status, page, pageSize);

    return {
      data: result.data.map(toBookingResponse),
      total: result.total,
      page,
      pageSize,
    };
  }

  async updateStatus(
    id: string,
    coachId: string,
    role: UserRole,
    input: UpdateBookingStatusInput,
  ): Promise<BookingResponse> {
    if (role !== UserRole.COACH) {
      throw new ForbiddenError('Only coaches can update booking status');
    }

    const booking = await bookingsRepository.findById(id);
    if (!booking || booking.workoutInstance.workout.coachId !== coachId) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new ValidationError('Only pending bookings can be approved or rejected');
    }

    const updated = await bookingsRepository.update(id, { status: input.status });

    const notificationType =
      input.status === 'APPROVED'
        ? NotificationType.BOOKING_APPROVED
        : NotificationType.BOOKING_REJECTED;

    notifyUser({
      userId: booking.clientId,
      type: notificationType,
      entityId: booking.id,
      payload: {
        bookingId: booking.id,
        workoutTitle: booking.workoutInstance.workout.title,
        scheduledAt: booking.workoutInstance.scheduledAt.toISOString(),
      },
    });

    return toBookingResponse(updated);
  }

  async cancel(id: string, clientId: string, role: UserRole): Promise<BookingResponse> {
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenError('Only clients can cancel their bookings');
    }

    const booking = await bookingsRepository.findById(id);
    if (!booking || booking.clientId !== clientId) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === 'CANCELED') {
      throw new ValidationError('Booking is already canceled');
    }

    if (booking.attendedAt) {
      throw new ValidationError('Cannot cancel an attended booking');
    }

    const updated = await bookingsRepository.update(id, { status: 'CANCELED' });

    notifyUser({
      userId: booking.workoutInstance.workout.coachId,
      type: NotificationType.BOOKING_CANCELED,
      entityId: booking.id,
      payload: {
        bookingId: booking.id,
        clientName: booking.client.profile?.name ?? 'Client',
        workoutTitle: booking.workoutInstance.workout.title,
        scheduledAt: booking.workoutInstance.scheduledAt.toISOString(),
      },
    });

    return toBookingResponse(updated);
  }

  async attend(id: string, coachId: string, role: UserRole): Promise<BookingResponse> {
    if (role !== UserRole.COACH) {
      throw new ForbiddenError('Only coaches can mark attendance');
    }

    const booking = await bookingsRepository.findById(id);
    if (!booking || booking.workoutInstance.workout.coachId !== coachId) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'APPROVED') {
      throw new ValidationError('Only approved bookings can be marked attended');
    }

    const attendedAt = new Date();
    const updated = await bookingsRepository.update(id, { attendedAt });

    await prisma.workoutInstance.update({
      where: { id: booking.workoutInstanceId },
      data: { status: 'COMPLETED' },
    });

    return toBookingResponse(updated);
  }
}

export const bookingsService = new BookingsService();
