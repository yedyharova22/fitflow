'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';
import WorkoutForm from '@/features/workouts/WorkoutForm';
import { Routes } from '@/consts/Pages';

export default function NewWorkoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.legacyRole !== 'trainer') {
    router.replace(Routes.DASHBOARD);
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Create workout
      </Typography>
      <WorkoutForm onSuccess={(workout) => router.push(Routes.WORKOUT_DETAIL(workout.id))} />
    </Box>
  );
}
