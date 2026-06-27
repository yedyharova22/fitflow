import type {
  CreateWorkoutInput,
  RecurrenceRule,
  UpdateWorkoutInput,
  WorkoutDetailResponse,
  WorkoutResponse,
  WorkoutSearchInput,
  WorkoutSearchResponse,
  WorkoutShareResponse,
} from '@fitflow/shared';
import { boundingBox, buildRecurrenceRule, haversineKm } from '@fitflow/shared';
import { UserRole } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { enqueueRecurrenceExpand } from '../../lib/workout-jobs.js';
import { workoutsRepository } from './workouts.repository.js';
import type { Prisma } from '@prisma/client';

const generateShareCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10);

function parseRecurrenceRule(value: unknown): RecurrenceRule | null {
  if (!value || typeof value !== 'object') return null;
  return value as RecurrenceRule;
}

function toWorkoutResponse(
  workout: {
    id: string;
    coachId: string;
    title: string;
    description: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    startAt: Date;
    recurrenceRule: unknown;
    maxCapacity: number | null;
    isActive: boolean;
    shareCode: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { instances: number };
  },
): WorkoutResponse {
  return {
    id: workout.id,
    coachId: workout.coachId,
    title: workout.title,
    description: workout.description,
    location: workout.location,
    latitude: workout.latitude,
    longitude: workout.longitude,
    startAt: workout.startAt.toISOString(),
    recurrenceRule: parseRecurrenceRule(workout.recurrenceRule),
    maxCapacity: workout.maxCapacity,
    isActive: workout.isActive,
    shareCode: workout.shareCode,
    instanceCount: workout._count?.instances,
    createdAt: workout.createdAt.toISOString(),
    updatedAt: workout.updatedAt.toISOString(),
  };
}

function toWorkoutDetail(workout: NonNullable<Awaited<ReturnType<typeof workoutsRepository.findById>>>): WorkoutDetailResponse {
  return {
    ...toWorkoutResponse(workout),
    instances: workout.instances.map((instance) => ({
      id: instance.id,
      scheduledAt: instance.scheduledAt.toISOString(),
      status: instance.status,
      bookingCount: instance._count.bookings,
    })),
  };
}

function resolveRecurrence(input: CreateWorkoutInput | UpdateWorkoutInput, startAt: string): RecurrenceRule | null | undefined {
  if ('recurrencePreset' in input && input.recurrencePreset) {
    const timezone = input.recurrencePreset.timezone;
    return buildRecurrenceRule(input.recurrencePreset, startAt, timezone);
  }
  if ('recurrenceRule' in input && input.recurrenceRule !== undefined) {
    return input.recurrenceRule ?? null;
  }
  return undefined;
}

export class WorkoutsService {
  private assertCoach(role: UserRole): void {
    if (role !== UserRole.COACH) {
      throw new ForbiddenError('Only coaches can manage workouts');
    }
  }

  async list(coachId: string, role: UserRole): Promise<WorkoutResponse[]> {
    this.assertCoach(role);
    const workouts = await workoutsRepository.listByCoach(coachId);
    return workouts.map(toWorkoutResponse);
  }

  async getById(id: string, coachId: string, role: UserRole): Promise<WorkoutDetailResponse> {
    this.assertCoach(role);
    const workout = await workoutsRepository.findById(id);
    if (!workout || workout.coachId !== coachId) {
      throw new NotFoundError('Workout not found');
    }
    return toWorkoutDetail(workout);
  }

  async getByShareCode(code: string): Promise<WorkoutShareResponse> {
    const workout = await workoutsRepository.findByShareCode(code);
    if (!workout || !workout.isActive) {
      throw new NotFoundError('Workout not found');
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      location: workout.location,
      coachName: workout.coach.profile?.name ?? 'Coach',
      maxCapacity: workout.maxCapacity,
      shareCode: workout.shareCode!,
      instances: workout.instances
        .filter((i) => i.scheduledAt <= cutoff)
        .map((instance) => ({
          id: instance.id,
          scheduledAt: instance.scheduledAt.toISOString(),
          status: instance.status,
        })),
    };
  }

  async searchDiscovery(query: WorkoutSearchInput): Promise<WorkoutSearchResponse> {
    const { lat, lng, radius, q, page, pageSize } = query;

    const geoFilters =
      lat != null && lng != null
        ? boundingBox(lat, lng, radius ?? 10)
        : undefined;

    const workouts = await workoutsRepository.searchDiscovery({
      q,
      minLat: geoFilters?.minLat,
      maxLat: geoFilters?.maxLat,
      minLng: geoFilters?.minLng,
      maxLng: geoFilters?.maxLng,
    });

    const origin = lat != null && lng != null ? { lat, lng } : null;

    const mapped = workouts.map((workout) => {
      const coachLat = workout.coach.latitude ?? workout.latitude;
      const coachLng = workout.coach.longitude ?? workout.longitude;
      let distanceKm: number | undefined;

      if (origin && coachLat != null && coachLng != null) {
        distanceKm = Math.round(haversineKm(origin, { lat: coachLat, lng: coachLng }) * 10) / 10;
      }

      const nextInstance = workout.instances[0];

      return {
        workout,
        distanceKm,
        nextInstanceAt: nextInstance?.scheduledAt.toISOString() ?? null,
      };
    });

    const filtered =
      origin && radius
        ? mapped.filter((item) => item.distanceKm == null || item.distanceKm <= radius)
        : mapped;

    filtered.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.nextInstanceAt && b.nextInstanceAt) {
        return new Date(a.nextInstanceAt).getTime() - new Date(b.nextInstanceAt).getTime();
      }
      return 0;
    });

    const total = filtered.length;
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: pageItems.map(({ workout, distanceKm, nextInstanceAt }) => ({
        id: workout.id,
        title: workout.title,
        description: workout.description,
        location: workout.location,
        coachName: workout.coach.profile?.name ?? 'Coach',
        shareCode: workout.shareCode,
        nextInstanceAt,
        distanceKm,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(coachId: string, role: UserRole, input: CreateWorkoutInput): Promise<WorkoutDetailResponse> {
    this.assertCoach(role);

    const recurrenceRule = resolveRecurrence(input, input.startAt) ?? null;
    const shareCode = generateShareCode();

    const workout = await workoutsRepository.create({
      title: input.title,
      description: input.description,
      location: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
      startAt: new Date(input.startAt),
      recurrenceRule: recurrenceRule ?? undefined,
      maxCapacity: input.maxCapacity,
      shareCode,
      coach: { connect: { id: coachId } },
    });

    if (recurrenceRule) {
      await enqueueRecurrenceExpand(workout.id);
    } else {
      await workoutsRepository.upsertInstance(workout.id, new Date(input.startAt));
    }

    const detail = await workoutsRepository.findById(workout.id);
    return toWorkoutDetail(detail!);
  }

  async update(
    id: string,
    coachId: string,
    role: UserRole,
    input: UpdateWorkoutInput,
  ): Promise<WorkoutDetailResponse> {
    this.assertCoach(role);
    const existing = await workoutsRepository.findById(id);
    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError('Workout not found');
    }

    const startAt = input.startAt ?? existing.startAt.toISOString();
    const recurrenceFromInput = resolveRecurrence(input, startAt);
    const data: Prisma.WorkoutUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.location !== undefined) data.location = input.location;
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;
    if (input.startAt !== undefined) data.startAt = new Date(input.startAt);
    if (input.maxCapacity !== undefined) data.maxCapacity = input.maxCapacity;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (recurrenceFromInput !== undefined) {
      data.recurrenceRule = recurrenceFromInput ?? undefined;
    }

    const recurrenceChanged =
      recurrenceFromInput !== undefined ||
      input.startAt !== undefined;

    if (recurrenceChanged) {
      await workoutsRepository.cancelFutureInstances(id, new Date());
    }

    const updated = await workoutsRepository.update(id, data);
    const finalRule = recurrenceFromInput !== undefined ? recurrenceFromInput : parseRecurrenceRule(existing.recurrenceRule);

    if (finalRule) {
      await enqueueRecurrenceExpand(id);
    } else if (recurrenceChanged) {
      await workoutsRepository.upsertInstance(id, new Date(startAt));
    }

    return toWorkoutDetail(updated);
  }

  async delete(id: string, coachId: string, role: UserRole): Promise<void> {
    this.assertCoach(role);
    const existing = await workoutsRepository.findById(id);
    if (!existing || existing.coachId !== coachId) {
      throw new NotFoundError('Workout not found');
    }

    await workoutsRepository.cancelFutureInstances(id, new Date());
    await workoutsRepository.update(id, { isActive: false });
  }
}

export const workoutsService = new WorkoutsService();
