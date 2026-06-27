import { z } from 'zod';

export const RecurrenceRuleSchema = z.object({
  rrule: z.string().min(1, 'RRule string is required'),
  dtstart: z.string().datetime({ message: 'dtstart must be ISO 8601 datetime' }),
  timezone: z.string().min(1, 'IANA timezone is required'),
  durationMinutes: z.number().int().min(15).max(480),
  exceptions: z.array(z.string().datetime()).optional().default([]),
  endDate: z.string().datetime().optional(),
});

export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>;

export const WeekdaySchema = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

export const RecurrencePresetSchema = z
  .object({
    type: z.enum(['none', 'daily', 'weekly']),
    daysOfWeek: z.array(WeekdaySchema).optional(),
    interval: z.number().int().min(1).max(52).optional(),
    durationMinutes: z.number().int().min(15).max(480),
    timezone: z.string().min(1),
    endDate: z.string().datetime().optional(),
    exceptions: z.array(z.string().datetime()).optional().default([]),
  })
  .refine(
    (data) => data.type !== 'weekly' || (data.daysOfWeek && data.daysOfWeek.length > 0),
    { message: 'Weekly recurrence requires at least one day', path: ['daysOfWeek'] },
  );

export type RecurrencePreset = z.infer<typeof RecurrencePresetSchema>;

const CreateWorkoutBaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  startAt: z.string().datetime(),
  recurrenceRule: RecurrenceRuleSchema.optional(),
  recurrencePreset: RecurrencePresetSchema.optional(),
  maxCapacity: z.number().int().min(1).optional(),
});

export const CreateWorkoutSchema = CreateWorkoutBaseSchema.refine(
  (data) => !(data.recurrenceRule && data.recurrencePreset),
  { message: 'Provide either recurrenceRule or recurrencePreset, not both' },
);

export type CreateWorkoutInput = z.infer<typeof CreateWorkoutBaseSchema>;

export const UpdateWorkoutSchema = CreateWorkoutBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;
