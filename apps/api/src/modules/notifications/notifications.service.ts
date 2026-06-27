import type {
  NotificationListInput,
  NotificationListResponse,
  NotificationPayload,
  NotificationResponse,
  PushSubscriptionInput,
  UnreadCountResponse,
} from '@fitflow/shared';
import type { NotificationType } from '@prisma/client';
import { NotFoundError } from '../../lib/errors.js';
import { env } from '../../config/env.js';
import { notificationsRepository } from './notifications.repository.js';

function toNotificationResponse(
  notification: {
    id: string;
    type: NotificationType;
    payload: unknown;
    readAt: Date | null;
    createdAt: Date;
  },
): NotificationResponse {
  return {
    id: notification.id,
    type: notification.type,
    payload: (notification.payload ?? {}) as NotificationResponse['payload'],
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export class NotificationsService {
  async list(userId: string, query: NotificationListInput): Promise<NotificationListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const unreadOnly = query.unreadOnly === 'true';

    const result = await notificationsRepository.list(userId, unreadOnly, page, pageSize);

    return {
      data: result.data.map(toNotificationResponse),
      total: result.total,
      page,
      pageSize,
    };
  }

  async unreadCount(userId: string): Promise<UnreadCountResponse> {
    const count = await notificationsRepository.countUnread(userId);
    return { count };
  }

  async markRead(userId: string, id: string): Promise<NotificationResponse> {
    const existing = await notificationsRepository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    if (!existing.readAt) {
      await notificationsRepository.markRead(id, userId);
    }

    const updated = await notificationsRepository.findById(id);
    return toNotificationResponse(updated!);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await notificationsRepository.markAllRead(userId);
    return { updated: result.count };
  }

  getVapidPublicKey(): { publicKey: string | null } {
    return { publicKey: env.VAPID_PUBLIC_KEY || null };
  }

  async subscribePush(userId: string, input: PushSubscriptionInput): Promise<void> {
    await notificationsRepository.upsertPushSubscription(
      userId,
      input.endpoint,
      input.keys.p256dh,
      input.keys.auth,
    );
  }

  async unsubscribePush(userId: string, endpoint: string): Promise<void> {
    await notificationsRepository.deletePushSubscription(userId, endpoint);
  }
}

export const notificationsService = new NotificationsService();
