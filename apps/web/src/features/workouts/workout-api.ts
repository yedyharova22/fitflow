import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  WorkoutDetailResponse,
  WorkoutResponse,
  WorkoutShareResponse,
} from '@fitflow/shared';
import { apiClient } from '@/lib/api-client';

export function listWorkouts(): Promise<{ data: WorkoutResponse[] }> {
  return apiClient.get<{ data: WorkoutResponse[] }>('/v1/workouts');
}

export function getWorkout(id: string): Promise<WorkoutDetailResponse> {
  return apiClient.get<WorkoutDetailResponse>(`/v1/workouts/${id}`);
}

export function getWorkoutByShareCode(code: string): Promise<WorkoutShareResponse> {
  return apiClient.get<WorkoutShareResponse>(`/v1/workouts/share/${code}`, { skipAuth: true });
}

export function createWorkout(input: CreateWorkoutInput): Promise<WorkoutDetailResponse> {
  return apiClient.post<WorkoutDetailResponse>('/v1/workouts', input);
}

export function updateWorkout(id: string, input: UpdateWorkoutInput): Promise<WorkoutDetailResponse> {
  return apiClient.patch<WorkoutDetailResponse>(`/v1/workouts/${id}`, input);
}

export function deleteWorkout(id: string): Promise<void> {
  return apiClient.delete<void>(`/v1/workouts/${id}`);
}
