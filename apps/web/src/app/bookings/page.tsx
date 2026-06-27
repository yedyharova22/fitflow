'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { AppNavBar } from '@/components/AppNavBar';
import { useAuth } from '@/features/auth/use-auth';
import { useBookings } from '@/features/bookings/use-bookings';
import { BookingList } from '@/features/bookings/BookingList';

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useBookings();

  if (authLoading || isLoading) {
    return (
      <>
        <AppNavBar />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  const role = user?.legacyRole === 'trainer' ? 'trainer' : 'client';

  return (
    <>
      <AppNavBar />
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        My bookings
      </Typography>
      {error && (
        <Typography color="error">
          {error instanceof Error ? error.message : 'Failed to load bookings'}
        </Typography>
      )}
      <BookingList bookings={data?.data ?? []} role={role} />
      </Box>
    </>
  );
}
