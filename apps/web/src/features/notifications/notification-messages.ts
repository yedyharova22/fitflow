import type { NotificationResponse } from '@fitflow/shared';

export function formatNotificationMessage(notification: NotificationResponse): string {
  const { type, payload } = notification;
  const title = payload.workoutTitle ?? 'Workout';
  const client = payload.clientName ?? 'A client';
  const when = payload.scheduledAt
    ? new Date(payload.scheduledAt).toLocaleString()
    : '';

  switch (type) {
    case 'BOOKING_REQUEST':
      return `${client} requested to book "${title}"${when ? ` on ${when}` : ''}`;
    case 'BOOKING_APPROVED':
      return `Your booking for "${title}" was approved${when ? ` (${when})` : ''}`;
    case 'BOOKING_REJECTED':
      return `Your booking for "${title}" was declined${when ? ` (${when})` : ''}`;
    case 'BOOKING_CANCELED':
      return `${client} canceled their booking for "${title}"${when ? ` (${when})` : ''}`;
    case 'SCHEDULE_CHANGED':
      return `Schedule updated for "${title}"${when ? `: ${when}` : ''}`;
    case 'WORKOUT_CANCELED':
      return `"${title}" was canceled${when ? ` (was ${when})` : ''}`;
    default:
      return payload.message ?? 'You have a new notification';
  }
}

export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
