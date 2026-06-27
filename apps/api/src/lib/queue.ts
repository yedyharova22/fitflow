import { Queue } from 'bullmq';
import { env } from '../config/env.js';

const connectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

export const recurrenceQueue = new Queue('recurrence-expand', {
  connection: connectionOptions,
});

export const notificationQueue = new Queue('send-notification', {
  connection: connectionOptions,
});

export { connectionOptions as redisConnectionOptions };
