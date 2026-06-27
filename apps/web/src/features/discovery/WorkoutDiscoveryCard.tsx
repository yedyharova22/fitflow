'use client';

import Link from 'next/link';
import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import type { WorkoutDiscoveryResponse } from '@fitflow/shared';
import { Routes } from '@/consts/Pages';

interface WorkoutDiscoveryCardProps {
  workout: WorkoutDiscoveryResponse;
}

function formatNextSession(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WorkoutDiscoveryCard({ workout }: WorkoutDiscoveryCardProps) {
  const nextSession = formatNextSession(workout.nextInstanceAt);
  const joinHref = workout.shareCode ? Routes.JOIN(workout.shareCode) : null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600}>
          {workout.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          with {workout.coachName}
        </Typography>
        {workout.location && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {workout.location}
          </Typography>
        )}
        {workout.distanceKm != null && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {workout.distanceKm} km away
          </Typography>
        )}
        {nextSession && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">Next session: {nextSession}</Typography>
          </Box>
        )}
      </CardContent>
      {joinHref && (
        <CardActions>
          <Button component={Link} href={joinHref} size="small" variant="contained">
            View &amp; book
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
