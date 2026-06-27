import type { Response } from 'express';
import { env } from '../config/env.js';

/** Secure cookies require HTTPS; allow HTTP when CORS_ORIGIN is http (IP-based deploy). */
const cookieSecure = env.CORS_ORIGIN.startsWith('https://');

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
}
