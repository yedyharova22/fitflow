import type { Job } from 'bullmq';
import type { NotificationPayload, NotificationType } from '@fitflow/shared';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export interface SendNotificationJobData {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
}

export async function sendNotificationProcessor(
  job: Job<SendNotificationJobData>,
): Promise<void> {
  const { userId, type, payload } = job.data;
  logger.info({ userId, type, jobId: job.id }, 'Processing send-notification job');

  await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
    },
  });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length > 0) {
    logger.info(
      { userId, count: subscriptions.length },
      'Push stub — would notify subscriptions',
    );
  }

  logger.info({ userId }, 'Created in-app notification');
}
