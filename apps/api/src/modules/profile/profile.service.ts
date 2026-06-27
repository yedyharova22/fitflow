import type { ProfileResponse, UpdateProfileInput } from '@fitflow/shared';
import { UserRole as SharedUserRole } from '@fitflow/shared';
import type { UserRole as PrismaUserRole } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { uploadAvatarImage } from '../../lib/avatar-storage.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { profileRepository } from './profile.repository.js';

const authRepo = new AuthRepository();

function toProfileResponse(user: {
  id: string;
  role: PrismaUserRole;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  profile: {
    name: string;
    avatarUrl: string | null;
    age: number | null;
    description: string | null;
  } | null;
}): ProfileResponse {
  const role = user.role as SharedUserRole;
  return {
    id: user.id,
    name: user.profile?.name ?? 'User',
    avatarUrl: user.profile?.avatarUrl ?? null,
    age: user.profile?.age ?? null,
    description: user.profile?.description ?? null,
    email: user.email,
    role,
    legacyRole: role === SharedUserRole.COACH ? 'trainer' : 'client',
    latitude: user.latitude,
    longitude: user.longitude,
  };
}

export class ProfileService {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await profileRepository.findProfileByUserId(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toProfileResponse(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    const user = await profileRepository.findProfileByUserId(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hasLocationUpdate = input.latitude !== undefined || input.longitude !== undefined;
    if (hasLocationUpdate && user.role !== 'COACH') {
      throw new ForbiddenError('Only coaches can update location');
    }

    const updated = await profileRepository.updateProfile(userId, input);
    if (!updated) {
      throw new NotFoundError('User not found');
    }

    return toProfileResponse(updated);
  }

  async uploadAvatar(image: string) {
    return uploadAvatarImage(image);
  }

  async saveAvatar(userId: string, avatarUrl: string) {
    await authRepo.updateProfileAvatar(userId, avatarUrl);
    return { avatarUrl };
  }
}

export const profileService = new ProfileService();
