import { prisma } from '../../lib/prisma.js';

export class SubscriptionsRepository {
  async listByClient(clientId: string) {
    return prisma.coachSubscription.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        coach: { include: { profile: true } },
      },
    });
  }

  async find(clientId: string, coachId: string) {
    return prisma.coachSubscription.findUnique({
      where: { clientId_coachId: { clientId, coachId } },
    });
  }

  async create(clientId: string, coachId: string) {
    return prisma.coachSubscription.create({
      data: { clientId, coachId },
      include: {
        coach: { include: { profile: true } },
      },
    });
  }

  async delete(clientId: string, coachId: string) {
    return prisma.coachSubscription.delete({
      where: { clientId_coachId: { clientId, coachId } },
    });
  }
}

export const subscriptionsRepository = new SubscriptionsRepository();
