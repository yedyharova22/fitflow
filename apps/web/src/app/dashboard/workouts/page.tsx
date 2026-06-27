'use client';

import Link from 'next/link';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';
import { useWorkouts } from '@/features/workouts/use-workouts';
import WorkoutList from '@/features/workouts/WorkoutList';
import { Routes } from '@/consts/Pages';

export default function WorkoutsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: workouts, isLoading, error } = useWorkouts();

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user?.legacyRole !== 'trainer') {
    router.replace(Routes.DASHBOARD);
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Workouts</Typography>
        <Button component={Link} href={Routes.WORKOUT_NEW} variant="contained">
          Create workout
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error instanceof Error ? error.message : 'Failed to load workouts'}
        </Typography>
      )}
      {isLoading ? <CircularProgress sx={{ mt: 4, display: 'block', mx: 'auto' }} /> : <WorkoutList workouts={workouts ?? []} />}
    </Box>
  );
}
