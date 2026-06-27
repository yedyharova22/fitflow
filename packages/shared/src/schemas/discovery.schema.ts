import { z } from 'zod';

export const CoachSearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CoachSearchInput = z.infer<typeof CoachSearchSchema>;

export const WorkoutSearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type WorkoutSearchInput = z.infer<typeof WorkoutSearchSchema>;

export const CoachDiscoveryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  description: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  distanceKm: z.number().optional(),
  isSubscribed: z.boolean().optional(),
});

export type CoachDiscoveryResponse = z.infer<typeof CoachDiscoveryResponseSchema>;

export const CoachSearchResponseSchema = z.object({
  data: z.array(CoachDiscoveryResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type CoachSearchResponse = z.infer<typeof CoachSearchResponseSchema>;

export const WorkoutDiscoveryResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  coachName: z.string(),
  shareCode: z.string().nullable(),
  nextInstanceAt: z.string().datetime().nullable(),
  distanceKm: z.number().optional(),
});

export type WorkoutDiscoveryResponse = z.infer<typeof WorkoutDiscoveryResponseSchema>;

export const WorkoutSearchResponseSchema = z.object({
  data: z.array(WorkoutDiscoveryResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type WorkoutSearchResponse = z.infer<typeof WorkoutSearchResponseSchema>;

export const SubscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  coachId: z.string().uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  description: z.string().nullable(),
  subscribedAt: z.string().datetime(),
});

export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

export const SubscriptionListResponseSchema = z.object({
  data: z.array(SubscriptionResponseSchema),
});

export type SubscriptionListResponse = z.infer<typeof SubscriptionListResponseSchema>;
