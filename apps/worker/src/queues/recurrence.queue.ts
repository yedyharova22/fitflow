import { env } from '../config/env.js';

export const redisConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

export const QUEUE_NAMES = {
  RECURRENCE_EXPAND: 'recurrence-expand',
  SEND_NOTIFICATION: 'send-notification',
} as const;
