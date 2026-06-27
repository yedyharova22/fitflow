import { z } from 'zod';

export const UploadAvatarSchema = z.object({
  image: z.string().min(1),
});

export type UploadAvatarInput = z.infer<typeof UploadAvatarSchema>;

export const SaveAvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

export type SaveAvatarInput = z.infer<typeof SaveAvatarSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(13).max(120).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  age: z.number().int().nullable(),
  description: z.string().nullable(),
  email: z.string().email().nullable(),
  role: z.enum(['COACH', 'CLIENT']),
  legacyRole: z.enum(['trainer', 'client']),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
