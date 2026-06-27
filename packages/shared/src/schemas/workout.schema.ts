import { z } from 'zod';
import { RecurrenceRuleSchema } from './recurrence.schema.js';

export const WorkoutInstanceSummarySchema = z.object({
  id: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  status: z.enum(['SCHEDULED', 'CANCELED', 'COMPLETED']),
  bookingCount: z.number().int().optional(),
});

export type WorkoutInstanceSummary = z.infer<typeof WorkoutInstanceSummarySchema>;

export const WorkoutResponseSchema = z.object({
  id: z.string().uuid(),
  coachId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  startAt: z.string().datetime(),
  recurrenceRule: RecurrenceRuleSchema.nullable(),
  maxCapacity: z.number().int().nullable(),
  isActive: z.boolean(),
  shareCode: z.string().nullable(),
  instanceCount: z.number().int().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorkoutResponse = z.infer<typeof WorkoutResponseSchema>;

export const WorkoutDetailResponseSchema = WorkoutResponseSchema.extend({
  instances: z.array(WorkoutInstanceSummarySchema),
});

export type WorkoutDetailResponse = z.infer<typeof WorkoutDetailResponseSchema>;

export const WorkoutShareResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  coachName: z.string(),
  maxCapacity: z.number().int().nullable(),
  shareCode: z.string(),
  instances: z.array(WorkoutInstanceSummarySchema),
});

export type WorkoutShareResponse = z.infer<typeof WorkoutShareResponseSchema>;
