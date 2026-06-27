import { prisma } from '../../lib/prisma.js';
import type { BookingStatus, Prisma } from '@prisma/client';

export class BookingsRepository {
  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        client: { include: { profile: true } },
        workoutInstance: { include: { workout: true } },
      },
    });
  }

  async create(data: { clientId: string; workoutInstanceId: string }) {
    return prisma.booking.create({
      data: {
        clientId: data.clientId,
        workoutInstanceId: data.workoutInstanceId,
        status: 'PENDING',
      },
      include: {
        client: { include: { profile: true } },
        workoutInstance: { include: { workout: true } },
      },
    });
  }

  async update(id: string, data: Prisma.BookingUpdateInput) {
    return prisma.booking.update({
      where: { id },
      data,
      include: {
        client: { include: { profile: true } },
        workoutInstance: { include: { workout: true } },
      },
    });
  }

  async countApprovedForInstance(workoutInstanceId: string): Promise<number> {
    return prisma.booking.count({
      where: {
        workoutInstanceId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
  }

  async listForClient(clientId: string, status?: BookingStatus, page = 1, pageSize = 20) {
    const where: Prisma.BookingWhereInput = { clientId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: { include: { profile: true } },
          workoutInstance: { include: { workout: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { data, total };
  }

  async listForCoach(
    coachId: string,
    filters: { status?: BookingStatus; clientId?: string },
    page = 1,
    pageSize = 20,
  ) {
    const where: Prisma.BookingWhereInput = {
      workoutInstance: { workout: { coachId } },
    };
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: { include: { profile: true } },
          workoutInstance: { include: { workout: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { data, total };
  }
}

export const bookingsRepository = new BookingsRepository();
