/**
 * One-time migration helper: import Trainer/Client rows from a legacy trainer-subscriptions DB.
 *
 * Usage (with legacy DATABASE_URL pointing at trainer-subscriptions postgres):
 *   LEGACY_DATABASE_URL=postgresql://... dotenv -e ../../.env -- tsx prisma/migrate-trainer-subscriptions.ts
 *
 * Or run against same DB after manual export — expects legacy tables Trainer and Client to exist.
 */
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  if (!legacyUrl) {
    console.log('Set LEGACY_DATABASE_URL to migrate from trainer-subscriptions DB.');
    console.log('Skipping — schema fields passwordHash and coachId are ready for new registrations.');
    return;
  }

  const { PrismaClient: LegacyPrisma } = await import('@prisma/client');
  const legacy = new LegacyPrisma({ datasources: { db: { url: legacyUrl } } });

  const trainers = await legacy.$queryRaw<
    { id: string; name: string; email: string; password: string; avatarUrl: string | null }[]
  >`SELECT id, name, email, password, "avatarUrl" FROM "Trainer"`;

  for (const trainer of trainers) {
    await prisma.user.upsert({
      where: { email: trainer.email },
      update: {},
      create: {
        id: trainer.id,
        role: UserRole.COACH,
        email: trainer.email,
        passwordHash: trainer.password,
        profile: {
          create: {
            name: trainer.name,
            avatarUrl: trainer.avatarUrl,
          },
        },
      },
    });
  }

  const clients = await legacy.$queryRaw<
    {
      id: string;
      name: string;
      email: string;
      password: string;
      phone: string | null;
      avatarUrl: string | null;
      trainerId: string;
    }[]
  >`SELECT id, name, email, password, phone, "avatarUrl", "trainerId" FROM "Client"`;

  for (const client of clients) {
    await prisma.user.upsert({
      where: { email: client.email },
      update: {},
      create: {
        id: client.id,
        role: UserRole.CLIENT,
        email: client.email,
        phone: client.phone,
        passwordHash: client.password,
        coachId: client.trainerId,
        profile: {
          create: {
            name: client.name,
            avatarUrl: client.avatarUrl,
          },
        },
      },
    });
  }

  console.log(`Migrated ${trainers.length} trainers and ${clients.length} clients.`);
  await legacy.$disconnect();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
