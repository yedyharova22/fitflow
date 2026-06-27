import jwt from 'jsonwebtoken';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  deviceId?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function generateRefreshTokenValue(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function verifyTokenHash(value: string, hash: string): boolean {
  const valueHash = hashToken(value);
  const a = Buffer.from(valueHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
