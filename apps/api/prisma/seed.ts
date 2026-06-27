import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const coach = await prisma.user.upsert({
    where: { email: 'coach@fitflow.dev' },
    update: {},
    create: {
      role: UserRole.COACH,
      email: 'coach@fitflow.dev',
      latitude: 50.4501,
      longitude: 30.5234,
      profile: {
        create: {
          name: 'Demo Coach',
          description: 'Sample coach for development',
        },
      },
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@fitflow.dev' },
    update: {},
    create: {
      role: UserRole.CLIENT,
      email: 'client@fitflow.dev',
      coachId: coach.id,
      profile: {
        create: {
          name: 'Demo Client',
        },
      },
    },
  });

  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 1);
  startAt.setHours(9, 0, 0, 0);

  const workout = await prisma.workout.upsert({
    where: { shareCode: 'DEMO2026' },
    update: {},
    create: {
      coachId: coach.id,
      title: 'Morning HIIT',
      description: 'Demo recurring workout',
      location: 'Central Park',
      startAt,
      shareCode: 'DEMO2026',
      maxCapacity: 10,
      recurrenceRule: {
        rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1',
        dtstart: startAt.toISOString(),
        timezone: 'Europe/Kyiv',
        durationMinutes: 60,
        exceptions: [],
      },
    },
  });

  const instance = await prisma.workoutInstance.upsert({
    where: {
      workoutId_scheduledAt: { workoutId: workout.id, scheduledAt: startAt },
    },
    update: {},
    create: {
      workoutId: workout.id,
      scheduledAt: startAt,
      status: 'SCHEDULED',
    },
  });

  await prisma.booking.upsert({
    where: {
      clientId_workoutInstanceId: { clientId: client.id, workoutInstanceId: instance.id },
    },
    update: {},
    create: {
      clientId: client.id,
      workoutInstanceId: instance.id,
      status: 'PENDING',
    },
  });

  await prisma.notification.deleteMany({
    where: { userId: { in: [coach.id, client.id] } },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: coach.id,
        type: 'BOOKING_REQUEST',
        payload: {
          bookingId: 'demo',
          clientName: 'Demo Client',
          workoutTitle: 'Morning HIIT',
          scheduledAt: startAt.toISOString(),
        },
      },
      {
        userId: client.id,
        type: 'BOOKING_APPROVED',
        payload: {
          bookingId: 'demo',
          workoutTitle: 'Morning HIIT',
          scheduledAt: startAt.toISOString(),
        },
      },
    ],
  });

  console.log('Seed complete:', {
    coachId: coach.id,
    clientId: client.id,
    workoutId: workout.id,
    shareCode: workout.shareCode,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
