import type { RecurrencePreset } from '../schemas/recurrence.schema.js';
import type { RecurrenceRule } from '../schemas/recurrence.schema.js';

const DAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

export function buildRecurrenceRule(
  preset: RecurrencePreset,
  startAt: string,
  timezone: string,
): RecurrenceRule | null {
  if (preset.type === 'none') {
    return null;
  }

  const interval = preset.interval ?? 1;
  let rrule: string;

  if (preset.type === 'daily') {
    rrule = `FREQ=DAILY;INTERVAL=${interval}`;
  } else {
    const days = preset.daysOfWeek?.length
      ? preset.daysOfWeek
      : [DAY_MAP[new Date(startAt).getUTCDay()]];
    rrule = `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${days.join(',')}`;
  }

  return {
    rrule,
    dtstart: startAt,
    timezone,
    durationMinutes: preset.durationMinutes,
    exceptions: preset.exceptions ?? [],
    endDate: preset.endDate,
  };
}
