import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'BOOKING_REQUEST',
  'BOOKING_APPROVED',
  'BOOKING_REJECTED',
  'BOOKING_CANCELED',
  'SCHEDULE_CHANGED',
  'WORKOUT_CANCELED',
]);

export type NotificationTypeValue = z.infer<typeof NotificationTypeSchema>;

export const NotificationPayloadSchema = z.object({
  bookingId: z.string().uuid().optional(),
  workoutId: z.string().uuid().optional(),
  workoutTitle: z.string().optional(),
  clientName: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  message: z.string().optional(),
});

export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  payload: NotificationPayloadSchema,
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

export const NotificationListSchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationListInput = z.infer<typeof NotificationListSchema>;

export const NotificationListResponseSchema = z.object({
  data: z.array(NotificationResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

export const UnreadCountResponseSchema = z.object({
  count: z.number().int(),
});

export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;

export const PushSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type PushSubscriptionInput = z.infer<typeof PushSubscriptionInputSchema>;

export const PushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export type PushUnsubscribeInput = z.infer<typeof PushUnsubscribeSchema>;

export const VapidPublicKeyResponseSchema = z.object({
  publicKey: z.string().nullable(),
});

export type VapidPublicKeyResponse = z.infer<typeof VapidPublicKeyResponseSchema>;
