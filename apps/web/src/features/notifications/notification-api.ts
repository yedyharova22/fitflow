import type {
  NotificationListResponse,
  NotificationResponse,
  PushSubscriptionInput,
  UnreadCountResponse,
  VapidPublicKeyResponse,
} from '@fitflow/shared';
import { apiClient } from '@/lib/api-client';

export function listNotifications(params?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}): Promise<NotificationListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  if (params?.unreadOnly) search.set('unreadOnly', 'true');
  const qs = search.toString();
  return apiClient.get<NotificationListResponse>(`/v1/notifications${qs ? `?${qs}` : ''}`);
}

export function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>('/v1/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<NotificationResponse> {
  return apiClient.patch<NotificationResponse>(`/v1/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiClient.patch<{ updated: number }>('/v1/notifications/read-all');
}

export function getVapidPublicKey(): Promise<VapidPublicKeyResponse> {
  return apiClient.get<VapidPublicKeyResponse>('/v1/notifications/push/vapid-public-key');
}

export function subscribePush(input: PushSubscriptionInput): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/v1/notifications/push/subscribe', input);
}

export function unsubscribePush(endpoint: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>('/v1/notifications/push/subscribe', {
    body: { endpoint },
  });
}
