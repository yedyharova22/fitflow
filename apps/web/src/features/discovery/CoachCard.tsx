'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import type { CoachDiscoveryResponse } from '@fitflow/shared';
import { useSubscriptionMutations } from './use-discovery';

interface CoachCardProps {
  coach: CoachDiscoveryResponse;
  showSubscribe?: boolean;
}

export function CoachCard({ coach, showSubscribe = true }: CoachCardProps) {
  const { subscribe, unsubscribe } = useSubscriptionMutations();
  const isPending = subscribe.isPending || unsubscribe.isPending;

  const handleToggle = () => {
    if (coach.isSubscribed) {
      unsubscribe.mutate(coach.id);
    } else {
      subscribe.mutate(coach.id);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar src={coach.avatarUrl ?? undefined} alt={coach.name}>
            {coach.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {coach.name}
            </Typography>
            {coach.distanceKm != null && (
              <Typography variant="body2" color="text.secondary">
                {coach.distanceKm} km away
              </Typography>
            )}
            {coach.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {coach.description}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
      {showSubscribe && (
        <CardActions>
          <Button
            size="small"
            variant={coach.isSubscribed ? 'outlined' : 'contained'}
            onClick={handleToggle}
            disabled={isPending}
          >
            {coach.isSubscribed ? 'Following' : 'Follow'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
