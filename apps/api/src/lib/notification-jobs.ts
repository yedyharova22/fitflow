import type { NotificationPayload, NotificationType } from '@fitflow/shared';
import { notificationQueue } from './queue.js';

export interface EnqueueNotificationInput {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  entityId?: string;
}

export async function enqueueNotification(input: EnqueueNotificationInput): Promise<void> {
  const entityId = input.entityId ?? input.payload.bookingId ?? 'general';
  const jobId = `notification-${input.userId}-${input.type}-${entityId}`;

  await notificationQueue.add(
    'send',
    {
      userId: input.userId,
      type: input.type,
      payload: input.payload,
    },
    {
      jobId,
      removeOnComplete: 100,
    },
  );
}

/** Fire-and-forget — never fail the caller on queue errors. */
export function notifyUser(input: EnqueueNotificationInput): void {
  void enqueueNotification(input).catch((err) => {
    console.error('[notification-jobs] Failed to enqueue:', err);
  });
}
