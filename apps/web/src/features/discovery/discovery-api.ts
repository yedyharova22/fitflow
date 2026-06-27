import type {
  CoachSearchInput,
  CoachSearchResponse,
  SubscriptionListResponse,
  SubscriptionResponse,
  WorkoutSearchInput,
  WorkoutSearchResponse,
} from '@fitflow/shared';
import { apiClient } from '@/lib/api-client';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function searchCoaches(params: CoachSearchInput): Promise<CoachSearchResponse> {
  return apiClient.get<CoachSearchResponse>(
    `/v1/coaches${buildQuery({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      page: params.page,
      pageSize: params.pageSize,
    })}`,
  );
}

export function searchWorkouts(params: WorkoutSearchInput): Promise<WorkoutSearchResponse> {
  return apiClient.get<WorkoutSearchResponse>(
    `/v1/workouts/search${buildQuery({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      q: params.q,
      page: params.page,
      pageSize: params.pageSize,
    })}`,
  );
}

export function listSubscriptions(): Promise<SubscriptionListResponse> {
  return apiClient.get<SubscriptionListResponse>('/v1/subscriptions');
}

export function subscribeCoach(coachId: string): Promise<SubscriptionResponse> {
  return apiClient.post<SubscriptionResponse>(`/v1/subscriptions/${coachId}`, {});
}

export function unsubscribeCoach(coachId: string): Promise<void> {
  return apiClient.delete<void>(`/v1/subscriptions/${coachId}`);
}
