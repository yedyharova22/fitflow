import type { SubscriptionListResponse } from '@fitflow/shared';
import { UserRole } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { coachesRepository } from '../coaches/coaches.repository.js';
import { subscriptionsRepository } from './subscriptions.repository.js';

export class SubscriptionsService {
  private assertClient(role: UserRole): void {
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenError('Only clients can manage coach subscriptions');
    }
  }

  async list(clientId: string, role: UserRole): Promise<SubscriptionListResponse> {
    this.assertClient(role);
    const rows = await subscriptionsRepository.listByClient(clientId);
    return {
      data: rows.map((row) => ({
        id: row.id,
        coachId: row.coachId,
        name: row.coach.profile?.name ?? 'Coach',
        avatarUrl: row.coach.profile?.avatarUrl ?? null,
        description: row.coach.profile?.description ?? null,
        subscribedAt: row.createdAt.toISOString(),
      })),
    };
  }

  async subscribe(clientId: string, role: UserRole, coachId: string) {
    this.assertClient(role);

    const coach = await coachesRepository.findCoachById(coachId);
    if (!coach) {
      throw new NotFoundError('Coach not found');
    }

    const existing = await subscriptionsRepository.find(clientId, coachId);
    if (existing) {
      throw new ConflictError('Already subscribed to this coach');
    }

    const row = await subscriptionsRepository.create(clientId, coachId);
    return {
      id: row.id,
      coachId: row.coachId,
      name: row.coach.profile?.name ?? 'Coach',
      avatarUrl: row.coach.profile?.avatarUrl ?? null,
      description: row.coach.profile?.description ?? null,
      subscribedAt: row.createdAt.toISOString(),
    };
  }

  async unsubscribe(clientId: string, role: UserRole, coachId: string): Promise<void> {
    this.assertClient(role);

    const existing = await subscriptionsRepository.find(clientId, coachId);
    if (!existing) {
      throw new NotFoundError('Subscription not found');
    }

    await subscriptionsRepository.delete(clientId, coachId);
  }
}

export const subscriptionsService = new SubscriptionsService();
