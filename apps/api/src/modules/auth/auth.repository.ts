import { prisma } from '../../lib/prisma.js';

export class AuthRepository {
  async findDeviceToken(deviceId: string) {
    return prisma.deviceToken.findUnique({
      where: { deviceId },
      include: { user: { include: { profile: true } } },
    });
  }

  async createUserWithDevice(deviceId: string, userAgent?: string) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          profile: {
            create: { name: 'User' },
          },
        },
        include: { profile: true },
      });

      const deviceToken = await tx.deviceToken.create({
        data: { deviceId, userId: user.id, userAgent },
      });

      return { user, deviceToken };
    });
  }

  async updateDeviceLastSeen(deviceId: string, userAgent?: string) {
    return prisma.deviceToken.update({
      where: { deviceId },
      data: { lastSeenAt: new Date(), userAgent },
      include: { user: { include: { profile: true } } },
    });
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token: tokenHash, expiresAt },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: { include: { profile: true } } },
    });
  }

  async deleteRefreshToken(tokenHash: string) {
    await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
  }

  async deleteRefreshTokensByUser(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findClientsByCoachId(coachId: string) {
    return prisma.user.findMany({
      where: { coachId, role: 'CLIENT' },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoachUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string | null;
  }) {
    return prisma.user.create({
      data: {
        role: 'COACH',
        email: data.email,
        passwordHash: data.passwordHash,
        profile: {
          create: {
            name: data.name,
            avatarUrl: data.avatarUrl ?? null,
          },
        },
      },
      include: { profile: true },
    });
  }

  async createClientUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
    coachId?: string | null;
    avatarUrl?: string | null;
  }) {
    return prisma.user.create({
      data: {
        role: 'CLIENT',
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        coachId: data.coachId,
        profile: {
          create: {
            name: data.name,
            avatarUrl: data.avatarUrl ?? null,
          },
        },
      },
      include: { profile: true },
    });
  }

  async updateProfileAvatar(userId: string, avatarUrl: string) {
    return prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }

  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });
  }

  async linkDeviceToUser(deviceId: string, userId: string, userAgent?: string) {
    return prisma.deviceToken.upsert({
      where: { deviceId },
      update: { userId, lastSeenAt: new Date(), userAgent },
      create: { deviceId, userId, userAgent },
    });
  }

  async findLatestDeviceForUser(userId: string) {
    return prisma.deviceToken.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async deleteOrphanUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: { take: 1 },
        workouts: { take: 1 },
      },
    });

    if (!user) {
      return;
    }

    if (user.bookings.length > 0 || user.workouts.length > 0) {
      return;
    }

    await prisma.user.delete({ where: { id: userId } });
  }
}
