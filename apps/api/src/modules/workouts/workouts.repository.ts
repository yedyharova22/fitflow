import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export class WorkoutsRepository {
  async create(data: Prisma.WorkoutCreateInput) {
    return prisma.workout.create({ data });
  }

  async findById(id: string) {
    return prisma.workout.findUnique({
      where: { id },
      include: {
        instances: {
          orderBy: { scheduledAt: 'asc' },
          include: { _count: { select: { bookings: true } } },
        },
        _count: { select: { instances: true } },
      },
    });
  }

  async findByShareCode(shareCode: string) {
    return prisma.workout.findUnique({
      where: { shareCode },
      include: {
        coach: { include: { profile: true } },
        instances: {
          where: {
            status: 'SCHEDULED',
            scheduledAt: { gte: new Date() },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 50,
        },
      },
    });
  }

  async listByCoach(coachId: string) {
    return prisma.workout.findMany({
      where: { coachId },
      orderBy: { startAt: 'desc' },
      include: { _count: { select: { instances: true } } },
    });
  }

  async update(id: string, data: Prisma.WorkoutUpdateInput) {
    return prisma.workout.update({
      where: { id },
      data,
      include: {
        instances: {
          orderBy: { scheduledAt: 'asc' },
          include: { _count: { select: { bookings: true } } },
        },
        _count: { select: { instances: true } },
      },
    });
  }

  async upsertInstance(workoutId: string, scheduledAt: Date) {
    return prisma.workoutInstance.upsert({
      where: {
        workoutId_scheduledAt: { workoutId, scheduledAt },
      },
      create: { workoutId, scheduledAt, status: 'SCHEDULED' },
      update: { status: 'SCHEDULED' },
    });
  }

  async cancelFutureInstances(workoutId: string, from: Date) {
    return prisma.workoutInstance.updateMany({
      where: {
        workoutId,
        scheduledAt: { gte: from },
        status: 'SCHEDULED',
      },
      data: { status: 'CANCELED' },
    });
  }

  async searchDiscovery(filters: {
    q?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
  }) {
    const now = new Date();
    const and: Prisma.WorkoutWhereInput[] = [{ isActive: true }];

    if (filters.q) {
      and.push({
        OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { location: { contains: filters.q, mode: 'insensitive' } },
        ],
      });
    }

    if (
      filters.minLat != null &&
      filters.maxLat != null &&
      filters.minLng != null &&
      filters.maxLng != null
    ) {
      and.push({
        OR: [
          {
            coach: {
              latitude: { gte: filters.minLat, lte: filters.maxLat },
              longitude: { gte: filters.minLng, lte: filters.maxLng },
            },
          },
          {
            latitude: { gte: filters.minLat, lte: filters.maxLat },
            longitude: { gte: filters.minLng, lte: filters.maxLng },
          },
        ],
      });
    }

    return prisma.workout.findMany({
      where: { AND: and },
      include: {
        coach: { include: { profile: true } },
        instances: {
          where: {
            status: 'SCHEDULED',
            scheduledAt: { gte: now },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { startAt: 'asc' },
    });
  }
}

export const workoutsRepository = new WorkoutsRepository();
