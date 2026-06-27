'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, CircularProgress, Box, Typography, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';
import { listClients, type ClientSummary } from '@/features/auth/auth-api';
import { Routes } from '@/consts/Pages';
import DashboardClient from '@/app/dashboard/DashboardClient';
import { useBookings } from '@/features/bookings/use-bookings';
import BookingStatusChip from '@/features/bookings/BookingStatusChip';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const { data: bookingsData } = useBookings();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(Routes.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user || user.legacyRole !== 'trainer') {
      setLoadingClients(false);
      return;
    }

    void listClients()
      .then(setClients)
      .finally(() => setLoadingClients(false));
  }, [user]);

  if (isLoading || loadingClients) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  if (user.legacyRole === 'trainer') {
    const trainer = {
      id: user.id,
      name: user.profile?.name ?? 'Trainer',
      email: user.email ?? '',
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email ?? '',
        phone: c.phone,
      })),
    };

    return (
      <DashboardClient trainer={trainer} onClientAdded={(client) => setClients((prev) => [...prev, client])} />
    );
  }

  const recentBookings = bookingsData?.data.slice(0, 3) ?? [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Welcome, {user.profile?.name}!
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Use a workout join link from your coach to book sessions.
      </Typography>
      <Button component={Link} href={Routes.BOOKINGS} variant="contained" sx={{ mb: 3 }}>
        View my bookings
      </Button>
      {recentBookings.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent bookings
          </Typography>
          {recentBookings.map((booking) => (
            <Box key={booking.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Box>
                <Typography>{booking.instance.workoutTitle}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(booking.instance.scheduledAt).toLocaleString()}
                </Typography>
              </Box>
              <BookingStatusChip status={booking.status} />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}
