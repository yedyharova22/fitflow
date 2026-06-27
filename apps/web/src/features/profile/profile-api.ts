import type { ProfileResponse, UpdateProfileInput } from '@fitflow/shared';
import { apiClient } from '@/lib/api-client';

export function getProfile(): Promise<ProfileResponse> {
  return apiClient.get<ProfileResponse>('/v1/profile');
}

export function updateProfile(input: UpdateProfileInput): Promise<ProfileResponse> {
  return apiClient.patch<ProfileResponse>('/v1/profile', input);
}

export function uploadAvatar(image: string): Promise<{ url: string }> {
  return apiClient.post<{ url: string }>('/v1/profile/avatar/upload', { image });
}

export function saveAvatar(avatarUrl: string): Promise<{ avatarUrl: string }> {
  return apiClient.post<{ avatarUrl: string }>('/v1/profile/avatar', { avatarUrl });
}
