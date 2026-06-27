import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export class CoachesRepository {
  async findInBoundingBox(box: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) {
    return prisma.user.findMany({
      where: {
        role: 'COACH',
        latitude: { not: null, gte: box.minLat, lte: box.maxLat },
        longitude: { not: null, gte: box.minLng, lte: box.maxLng },
      },
      include: { profile: true },
    });
  }

  async findCoachById(id: string) {
    return prisma.user.findFirst({
      where: { id, role: 'COACH' },
      include: { profile: true },
    });
  }

  async findSubscriptionsForClient(clientId: string, coachIds: string[]) {
    if (coachIds.length === 0) return [];
    return prisma.coachSubscription.findMany({
      where: { clientId, coachId: { in: coachIds } },
    });
  }
}

export const coachesRepository = new CoachesRepository();
