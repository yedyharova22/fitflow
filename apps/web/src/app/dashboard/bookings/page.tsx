'use client';

import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/features/auth/use-auth';
import { useRouter } from 'next/navigation';
import { useBookings } from '@/features/bookings/use-bookings';
import { BookingList } from '@/features/bookings/BookingList';
import { Routes } from '@/consts/Pages';
import type { BookingResponse } from '@fitflow/shared';

export default function CoachBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<BookingResponse['status'] | ''>('');
  const { data, isLoading, error } = useBookings(status ? { status, page: 1, pageSize: 20 } : undefined);

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
      <Typography variant="h5" sx={{ mb: 2 }}>
        Bookings
      </Typography>
      <FormControl sx={{ minWidth: 180, mb: 2 }}>
        <InputLabel id="status-filter">Status</InputLabel>
        <Select
          labelId="status-filter"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingResponse['status'] | '')}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="CANCELED">Canceled</MenuItem>
        </Select>
      </FormControl>
      {error && (
        <Typography color="error">
          {error instanceof Error ? error.message : 'Failed to load bookings'}
        </Typography>
      )}
      {isLoading ? <CircularProgress /> : <BookingList bookings={data?.data ?? []} role="trainer" />}
    </Box>
  );
}
