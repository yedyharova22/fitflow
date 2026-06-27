import type { ApiErrorResponse, RefreshResponse } from '@fitflow/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
  skipAuth?: boolean;
  _retried?: boolean;
}

type TokenGetter = () => string | null;
type TokenRefreshedHandler = (accessToken: string) => void;
type AuthFailureHandler = () => void;

let getAccessToken: TokenGetter = () => null;
let onTokenRefreshed: TokenRefreshedHandler = () => {};
let onAuthFailure: AuthFailureHandler = () => {};

let refreshPromise: Promise<string> | null = null;

export function setAccessTokenGetter(getter: TokenGetter): void {
  getAccessToken = getter;
}

export function setTokenRefreshedHandler(handler: TokenRefreshedHandler): void {
  onTokenRefreshed = handler;
}

export function setAuthFailureHandler(handler: AuthFailureHandler): void {
  onAuthFailure = handler;
}

export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        onAuthFailure();
        throw new ApiClientError(response.status, 'Refresh failed');
      }

      const data = (await response.json()) as RefreshResponse;
      onTokenRefreshed(data.accessToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function isAuthPath(path: string): boolean {
  return path.startsWith('/v1/auth/device') || path.startsWith('/v1/auth/refresh');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, skipAuth, _retried, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const accessToken = token ?? (skipAuth ? null : getAccessToken());
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 401 && !skipAuth && !isAuthPath(path) && !_retried) {
    try {
      const newToken = await refreshAccessToken();
      return request<T>(path, { ...options, token: newToken, _retried: true });
    } catch {
      throw new ApiClientError(401, 'Session expired');
    }
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiClientError(
      response.status,
      errorBody?.error?.message ?? response.statusText,
      errorBody?.error?.code,
      errorBody?.error?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
