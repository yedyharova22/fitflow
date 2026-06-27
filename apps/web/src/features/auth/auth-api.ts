import type {
  DeviceAuthInput,
  DeviceAuthResponse,
  LoginInput,
  RecoverAuthInput,
  RefreshResponse,
  RegisterInput,
  RequestRecoverInput,
} from '@fitflow/shared';
import { apiClient, refreshAccessToken } from '@/lib/api-client';

export function authenticateDevice(input: DeviceAuthInput): Promise<DeviceAuthResponse> {
  return apiClient.post<DeviceAuthResponse>('/v1/auth/device', input, { skipAuth: true });
}

export function login(input: LoginInput): Promise<DeviceAuthResponse> {
  return apiClient.post<DeviceAuthResponse>('/v1/auth/login', input, { skipAuth: true });
}

export function register(input: RegisterInput): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/v1/auth/register', input, { skipAuth: true });
}

export function logout(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/v1/auth/logout', {}, { skipAuth: true });
}

export function requestRecoverOtp(input: RequestRecoverInput): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/v1/auth/recover/request', input, { skipAuth: true });
}

export function recoverAccount(input: RecoverAuthInput): Promise<DeviceAuthResponse> {
  return apiClient.post<DeviceAuthResponse>('/v1/auth/recover', input, { skipAuth: true });
}

export function getMe(): Promise<{ user: DeviceAuthResponse['user'] }> {
  return apiClient.get<{ user: DeviceAuthResponse['user'] }>('/v1/auth/me');
}

export function refreshSession(): Promise<RefreshResponse> {
  return refreshAccessToken({ notifyAuthFailure: false }).then((accessToken) => ({ accessToken }));
}

/** Restores session from httpOnly refresh cookie; token is set before /me is called. */
export async function restoreSessionFromCookies(): Promise<DeviceAuthResponse> {
  const refreshed = await refreshSession();
  return fetchMeWithToken(refreshed.accessToken);
}

async function fetchMeWithToken(accessToken: string): Promise<DeviceAuthResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const meRes = await fetch(`${API_URL}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!meRes.ok) {
    throw new Error('Failed to restore session');
  }
  const { user } = (await meRes.json()) as { user: DeviceAuthResponse['user'] };
  return { accessToken, user };
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
}

export function listClients(): Promise<ClientSummary[]> {
  return apiClient.get<ClientSummary[]>('/v1/clients');
}

export function createClient(body: {
  name: string;
  email: string;
  phone?: string;
  trainerId: string;
}): Promise<ClientSummary & { tempPassword: string }> {
  return apiClient.post<ClientSummary & { tempPassword: string }>('/v1/clients', body);
}

export { uploadAvatar, saveAvatar } from '@/features/profile/profile-api';
