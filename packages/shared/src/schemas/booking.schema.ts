import { z } from 'zod';

export const CreateBookingSchema = z.object({
  workoutInstanceId: z.string().uuid(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'CANCELED']),
});

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

export const BookingListSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'CANCELED']).optional(),
  clientId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type BookingListInput = z.infer<typeof BookingListSchema>;

export const BookingClientSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable(),
});

export const BookingInstanceSummarySchema = z.object({
  id: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  workoutId: z.string().uuid(),
  workoutTitle: z.string(),
});

export const BookingResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'CANCELED']),
  attendedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  client: BookingClientSummarySchema,
  instance: BookingInstanceSummarySchema,
});

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

export const BookingListResponseSchema = z.object({
  data: z.array(BookingResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type BookingListResponse = z.infer<typeof BookingListResponseSchema>;
