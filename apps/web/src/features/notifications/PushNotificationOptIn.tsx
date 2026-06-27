'use client';

import { Alert, Button, CircularProgress } from '@mui/material';
import { usePushSubscription } from './use-push-subscription';

export function PushNotificationOptIn() {
  const { subscribe, isSubscribing, error, subscribed } = usePushSubscription();

  if (subscribed) {
    return (
      <Alert severity="success" sx={{ py: 0 }}>
        Browser notifications enabled
      </Alert>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="warning" sx={{ mb: 1, py: 0 }}>
          {error}
        </Alert>
      )}
      <Button
        fullWidth
        size="small"
        variant="outlined"
        onClick={() => void subscribe()}
        disabled={isSubscribing}
        startIcon={isSubscribing ? <CircularProgress size={16} /> : undefined}
      >
        Enable browser notifications
      </Button>
    </>
  );
}
