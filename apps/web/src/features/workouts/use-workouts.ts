'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '@fitflow/shared';
import {
  createWorkout,
  deleteWorkout,
  getWorkout,
  listWorkouts,
  updateWorkout,
} from './workout-api';

export const WORKOUTS_QUERY_KEY = ['workouts'] as const;
export const workoutQueryKey = (id: string) => ['workout', id] as const;

export function useWorkouts() {
  return useQuery({
    queryKey: WORKOUTS_QUERY_KEY,
    queryFn: async () => {
      const res = await listWorkouts();
      return res.data;
    },
    staleTime: 60_000,
    networkMode: 'offlineFirst',
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutQueryKey(id),
    queryFn: () => getWorkout(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useWorkoutMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY });
  };

  const create = useMutation({
    mutationFn: (input: CreateWorkoutInput) => createWorkout(input),
    onSuccess: (workout) => {
      invalidate();
      queryClient.setQueryData(workoutQueryKey(workout.id), workout);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkoutInput }) =>
      updateWorkout(id, input),
    onSuccess: (workout) => {
      invalidate();
      queryClient.setQueryData(workoutQueryKey(workout.id), workout);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteWorkout(id),
    onSuccess: () => invalidate(),
  });

  return { create, update, remove };
}
