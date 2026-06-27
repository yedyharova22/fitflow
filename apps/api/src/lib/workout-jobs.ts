import { recurrenceQueue } from './queue.js';

export async function enqueueRecurrenceExpand(workoutId: string): Promise<void> {
  await recurrenceQueue.add(
    'expand',
    { workoutId },
    {
      jobId: `recurrence-${workoutId}`,
      removeOnComplete: 100,
    },
  );
}
