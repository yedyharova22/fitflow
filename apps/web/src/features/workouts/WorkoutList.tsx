'use client';

import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import Link from 'next/link';
import type { WorkoutResponse } from '@fitflow/shared';
import { Routes } from '@/consts/Pages';

interface WorkoutListProps {
  workouts: WorkoutResponse[];
}

export default function WorkoutList({ workouts }: WorkoutListProps) {
  if (workouts.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No workouts yet. Create your first workout to get started.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
              <Box>
                <Typography variant="h6">{workout.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(workout.startAt).toLocaleString()}
                </Typography>
                {workout.location && (
                  <Typography variant="body2" color="text.secondary">
                    {workout.location}
                  </Typography>
                )}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Chip size="small" label={workout.recurrenceRule ? 'Recurring' : 'One-time'} />
                  {!workout.isActive && <Chip size="small" color="warning" label="Inactive" />}
                </Box>
              </Box>
              <Button component={Link} href={Routes.WORKOUT_DETAIL(workout.id)} variant="outlined">
                View
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
