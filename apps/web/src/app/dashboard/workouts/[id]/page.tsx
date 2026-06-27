'use client';

import { use } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';
import { useWorkout, useWorkoutMutations } from '@/features/workouts/use-workouts';
import ShareCodePanel from '@/features/workouts/ShareCodePanel';
import WorkoutForm from '@/features/workouts/WorkoutForm';
import { Routes } from '@/consts/Pages';

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { data: workout, isLoading, error } = useWorkout(id);
  const { remove } = useWorkoutMutations();

  if (user?.legacyRole !== 'trainer') {
    router.replace(Routes.DASHBOARD);
    return null;
  }

  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8 }} />;
  }

  if (error || !workout) {
    return <Typography color="error">Workout not found</Typography>;
  }

  const handleDelete = async () => {
    if (!confirm('Deactivate this workout?')) return;
    await remove.mutateAsync(workout.id);
    router.push(Routes.WORKOUTS);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {workout.title}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Upcoming sessions
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheduled</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Bookings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workout.instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>No sessions yet. Recurring workouts expand via the worker.</TableCell>
              </TableRow>
            ) : (
              workout.instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>{new Date(instance.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>{instance.status}</TableCell>
                  <TableCell>{instance.bookingCount ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {workout.shareCode && <ShareCodePanel shareCode={workout.shareCode} />}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Edit workout
        </Typography>
        <WorkoutForm workout={workout} />
      </Paper>

      <Button color="error" variant="outlined" onClick={handleDelete} sx={{ mt: 3 }}>
        Deactivate workout
      </Button>
    </Box>
  );
}
