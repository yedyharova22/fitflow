import type { Job } from 'bullmq';
import rrulePkg from 'rrule';

const { RRule } = rrulePkg;
import type { RecurrenceRule } from '@fitflow/shared';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export interface RecurrenceExpandJobData {
  workoutId: string;
}

const EXPAND_DAYS = 90;

function parseRecurrenceRule(value: unknown): RecurrenceRule | null {
  if (!value || typeof value !== 'object') return null;
  return value as RecurrenceRule;
}

function isException(scheduledAt: Date, exceptions: string[]): boolean {
  const key = scheduledAt.toISOString();
  return exceptions.some((ex) => new Date(ex).toISOString() === key);
}

export async function expandRecurrenceProcessor(
  job: Job<RecurrenceExpandJobData>,
): Promise<void> {
  const { workoutId } = job.data;
  logger.info({ workoutId, jobId: job.id }, 'Processing recurrence-expand job');

  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    logger.warn({ workoutId }, 'Workout not found');
    return;
  }

  const ruleJson = parseRecurrenceRule(workout.recurrenceRule);
  if (!ruleJson) {
    await prisma.workoutInstance.upsert({
      where: {
        workoutId_scheduledAt: { workoutId, scheduledAt: workout.startAt },
      },
      create: { workoutId, scheduledAt: workout.startAt, status: 'SCHEDULED' },
      update: { status: 'SCHEDULED' },
    });
    return;
  }

  const dtstart = new Date(ruleJson.dtstart);
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + EXPAND_DAYS);

  const endDate = ruleJson.endDate ? new Date(ruleJson.endDate) : until;
  const expandUntil = endDate < until ? endDate : until;

  const rruleString = `DTSTART:${dtstart.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nRRULE:${ruleJson.rrule}`;
  const rule = RRule.fromString(rruleString);

  const occurrences = rule.between(now, expandUntil, true);
  const exceptions = ruleJson.exceptions ?? [];

  for (const scheduledAt of occurrences) {
    if (isException(scheduledAt, exceptions)) continue;

    await prisma.workoutInstance.upsert({
      where: {
        workoutId_scheduledAt: { workoutId, scheduledAt },
      },
      create: { workoutId, scheduledAt, status: 'SCHEDULED' },
      update: { status: 'SCHEDULED' },
    });
  }

  logger.info({ workoutId, count: occurrences.length }, 'Upserted workout instances');
}
