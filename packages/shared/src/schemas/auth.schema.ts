import { z } from 'zod';

export const DeviceAuthSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID format'),
  userAgent: z.string().max(500).optional(),
});

export type DeviceAuthInput = z.infer<typeof DeviceAuthSchema>;

export const RequestRecoverSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID format'),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required' },
);

export type RequestRecoverInput = z.infer<typeof RequestRecoverSchema>;

export const RecoverAuthSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID format'),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  code: z.string().length(6, 'OTP code must be 6 digits'),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required' },
);

export type RecoverAuthInput = z.infer<typeof RecoverAuthSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['trainer', 'client']),
  trainerId: z.string().uuid().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
