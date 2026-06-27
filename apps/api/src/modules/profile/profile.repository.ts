import type { UpdateProfileInput } from '@fitflow/shared';
import { prisma } from '../../lib/prisma.js';

export class ProfileRepository {
  async findProfileByUserId(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { name, age, description, latitude, longitude } = input;

    return prisma.$transaction(async (tx) => {
      const profileData: {
        name?: string;
        age?: number | null;
        description?: string | null;
      } = {};

      if (name !== undefined) profileData.name = name;
      if (age !== undefined) profileData.age = age;
      if (description !== undefined) profileData.description = description;

      if (Object.keys(profileData).length > 0) {
        await tx.profile.update({
          where: { userId },
          data: profileData,
        });
      }

      const userData: {
        latitude?: number | null;
        longitude?: number | null;
      } = {};

      if (latitude !== undefined) userData.latitude = latitude;
      if (longitude !== undefined) userData.longitude = longitude;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userData,
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
    });
  }
}

export const profileRepository = new ProfileRepository();
