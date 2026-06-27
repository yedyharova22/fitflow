import { Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { redisConnectionOptions, QUEUE_NAMES } from './queues/recurrence.queue.js';
import { expandRecurrenceProcessor } from './processors/expand-recurrence.processor.js';
import { sendNotificationProcessor } from './processors/send-notification.processor.js';

logger.info({ redis: env.REDIS_URL }, 'FitFlow Worker starting');

const recurrenceWorker = new Worker(
  QUEUE_NAMES.RECURRENCE_EXPAND,
  expandRecurrenceProcessor,
  { connection: redisConnectionOptions, concurrency: 5 },
);

const notificationWorker = new Worker(
  QUEUE_NAMES.SEND_NOTIFICATION,
  sendNotificationProcessor,
  { connection: redisConnectionOptions, concurrency: 10 },
);

recurrenceWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, queue: QUEUE_NAMES.RECURRENCE_EXPAND }, 'Job completed');
});

recurrenceWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, queue: QUEUE_NAMES.RECURRENCE_EXPAND, err: err.message }, 'Job failed');
});

notificationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, queue: QUEUE_NAMES.SEND_NOTIFICATION }, 'Job completed');
});

notificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, queue: QUEUE_NAMES.SEND_NOTIFICATION, err: err.message }, 'Job failed');
});

logger.info(
  { queues: [QUEUE_NAMES.RECURRENCE_EXPAND, QUEUE_NAMES.SEND_NOTIFICATION] },
  'FitFlow Worker ready',
);

async function shutdown() {
  logger.info('Shutting down workers');
  await recurrenceWorker.close();
  await notificationWorker.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
