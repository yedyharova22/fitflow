'use client';

import { use } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getWorkoutByShareCode } from '@/features/workouts/workout-api';
import BookSessionButton from '@/features/bookings/BookSessionButton';

export default function JoinWorkoutPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ['workout-share', code],
    queryFn: () => getWorkoutByShareCode(code),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6, px: 2 }}>
        <Typography color="error">Workout not found or no longer available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6, px: 2, pb: 6 }}>
      <Typography variant="h4" gutterBottom>
        {data.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        with {data.coachName}
      </Typography>
      {data.description && <Typography sx={{ mb: 2 }}>{data.description}</Typography>}
      {data.location && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {data.location}
        </Typography>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming sessions
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2}>No upcoming sessions.</TableCell>
              </TableRow>
            ) : (
              data.instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>{new Date(instance.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <BookSessionButton instanceId={instance.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
