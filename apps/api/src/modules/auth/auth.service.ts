import type {
  DeviceAuthInput,
  LoginInput,
  RecoverAuthInput,
  RefreshTokenInput,
  RegisterInput,
  RequestRecoverInput,
} from '@fitflow/shared';
import { compare, hash } from 'bcrypt';
import {
  generateRefreshTokenValue,
  hashToken,
  signAccessToken,
} from '../../lib/jwt.js';
import type { AuthUser } from '@fitflow/shared';
import { UserRole as SharedUserRole } from '@fitflow/shared';
import type { UserRole as PrismaUserRole } from '@prisma/client';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../lib/errors.js';
import { AuthRepository } from './auth.repository.js';
import { otpStore } from './otp.store.js';

const authRepo = new AuthRepository();

const REFRESH_TOKEN_DAYS = 30;
const BCRYPT_ROUNDS = 10;

function getRefreshExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_DAYS);
  return date;
}

function toAuthUser(user: {
  id: string;
  role: PrismaUserRole;
  email: string | null;
  profile: {
    name: string;
    avatarUrl: string | null;
    age: number | null;
    description: string | null;
  } | null;
}): AuthUser {
  const role = user.role as SharedUserRole;
  return {
    id: user.id,
    role,
    email: user.email,
    profile: user.profile
      ? {
          name: user.profile.name,
          avatarUrl: user.profile.avatarUrl,
          age: user.profile.age,
          description: user.profile.description,
        }
      : null,
    legacyRole: role === SharedUserRole.COACH ? 'trainer' : 'client',
  };
}

async function issueSession(user: AuthUser, deviceId?: string) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    deviceId,
  });

  await authRepo.deleteRefreshTokensByUser(user.id);

  const refreshToken = generateRefreshTokenValue();
  const refreshTokenHash = hashToken(refreshToken);

  await authRepo.saveRefreshToken(user.id, refreshTokenHash, getRefreshExpiry());

  return { accessToken, refreshToken, user };
}

export class AuthService {
  async authenticateDevice(input: DeviceAuthInput) {
    const existing = await authRepo.findDeviceToken(input.deviceId);

    let user;
    if (existing) {
      const updated = await authRepo.updateDeviceLastSeen(input.deviceId, input.userAgent);
      user = updated.user;
    } else {
      const created = await authRepo.createUserWithDevice(input.deviceId, input.userAgent);
      user = created.user;
    }

    return issueSession(toAuthUser(user), input.deviceId);
  }

  async refreshAccessToken(refreshTokenRaw: string | undefined, input: RefreshTokenInput) {
    const token = refreshTokenRaw ?? input.refreshToken;
    if (!token) {
      throw new UnauthorizedError('Missing refresh token');
    }

    const tokenHash = hashToken(token);
    const stored = await authRepo.findRefreshToken(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await authRepo.deleteRefreshToken(tokenHash);
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = stored.user;

    const userDevice = await authRepo.findLatestDeviceForUser(user.id);
    const deviceId = userDevice?.deviceId;

    await authRepo.deleteRefreshToken(tokenHash);

    const authUser = toAuthUser(user);
    const session = await issueSession(authUser, deviceId);

    return { accessToken: session.accessToken, refreshToken: session.refreshToken };
  }

  async requestRecoverOtp(input: RequestRecoverInput) {
    const user = input.email
      ? await authRepo.findUserByEmail(input.email)
      : await authRepo.findUserByPhone(input.phone!);

    if (!user) {
      throw new NotFoundError('No account found for this email or phone');
    }

    const identifier = input.email ?? input.phone!;
    const code = otpStore.create(identifier);

    console.log(`[FitFlow OTP] ${identifier} → ${code}`);

    return { message: 'OTP sent' };
  }

  async recoverAccount(input: RecoverAuthInput) {
    const identifier = input.email ?? input.phone!;

    if (!otpStore.verify(identifier, input.code)) {
      throw new ValidationError('Invalid or expired OTP code');
    }

    const user = input.email
      ? await authRepo.findUserByEmail(input.email)
      : await authRepo.findUserByPhone(input.phone!);

    if (!user) {
      throw new NotFoundError('No account found for this email or phone');
    }

    const existingDevice = await authRepo.findDeviceToken(input.deviceId);
    const previousUserId =
      existingDevice && existingDevice.userId !== user.id
        ? existingDevice.userId
        : null;

    await authRepo.linkDeviceToUser(input.deviceId, user.id);

    if (previousUserId) {
      await authRepo.deleteOrphanUser(previousUserId);
    }

    otpStore.clear(identifier);

    return issueSession(toAuthUser(user), input.deviceId);
  }

  async getMe(userId: string) {
    const user = await authRepo.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toAuthUser(user);
  }

  async login(input: LoginInput) {
    const user = await authRepo.findUserByEmail(input.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (input.deviceId) {
      await authRepo.linkDeviceToUser(input.deviceId, user.id);
    }

    return issueSession(toAuthUser(user), input.deviceId);
  }

  async register(input: RegisterInput) {
    const existing = await authRepo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('User already exists');
    }

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

    const user =
      input.role === 'trainer'
        ? await authRepo.createCoachUser({
            name: input.name,
            email: input.email,
            passwordHash,
          })
        : await authRepo.createClientUser({
            name: input.name,
            email: input.email,
            passwordHash,
            coachId: input.trainerId ?? null,
          });

    return { message: 'User created successfully', user: toAuthUser(user) };
  }
}

export const authService = new AuthService();
