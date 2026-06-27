'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CoachSearchInput, WorkoutSearchInput } from '@fitflow/shared';
import {
  listSubscriptions,
  searchCoaches,
  searchWorkouts,
  subscribeCoach,
  unsubscribeCoach,
} from './discovery-api';

export const COACHES_QUERY_KEY = ['coaches'] as const;
export const WORKOUTS_SEARCH_QUERY_KEY = ['workouts-search'] as const;
export const SUBSCRIPTIONS_QUERY_KEY = ['subscriptions'] as const;

export function useCoachSearch(params: CoachSearchInput | null) {
  return useQuery({
    queryKey: [...COACHES_QUERY_KEY, params],
    queryFn: () => searchCoaches(params!),
    enabled: params != null,
    staleTime: 30_000,
  });
}

export function useWorkoutSearch(params: WorkoutSearchInput | null) {
  return useQuery({
    queryKey: [...WORKOUTS_SEARCH_QUERY_KEY, params],
    queryFn: () => searchWorkouts(params!),
    enabled: params != null,
    staleTime: 30_000,
  });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: SUBSCRIPTIONS_QUERY_KEY,
    queryFn: listSubscriptions,
    staleTime: 30_000,
  });
}

export function useSubscriptionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COACHES_QUERY_KEY });
  };

  const subscribe = useMutation({
    mutationFn: (coachId: string) => subscribeCoach(coachId),
    onSuccess: invalidate,
  });

  const unsubscribe = useMutation({
    mutationFn: (coachId: string) => unsubscribeCoach(coachId),
    onSuccess: invalidate,
  });

  return { subscribe, unsubscribe };
}
