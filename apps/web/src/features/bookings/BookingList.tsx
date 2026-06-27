'use client';

import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import type { BookingResponse } from '@fitflow/shared';
import BookingStatusChip from './BookingStatusChip';
import { useBookingMutations } from './use-bookings';

interface BookingActionsProps {
  booking: BookingResponse;
  role: 'trainer' | 'client';
}

export default function BookingActions({ booking, role }: BookingActionsProps) {
  const { updateStatus, cancel, attend } = useBookingMutations();

  if (role === 'trainer') {
    return (
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        {booking.status === 'PENDING' && (
          <>
            <Button
              size="small"
              variant="contained"
              onClick={() => updateStatus.mutate({ id: booking.id, input: { status: 'APPROVED' } })}
            >
              Approve
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => updateStatus.mutate({ id: booking.id, input: { status: 'CANCELED' } })}
            >
              Reject
            </Button>
          </>
        )}
        {booking.status === 'APPROVED' && !booking.attendedAt && (
          <Button size="small" variant="outlined" onClick={() => attend.mutate(booking.id)}>
            Mark attended
          </Button>
        )}
      </Box>
    );
  }

  if (booking.status === 'PENDING' || booking.status === 'APPROVED') {
    return (
      <Button size="small" color="error" sx={{ mt: 1 }} onClick={() => cancel.mutate(booking.id)}>
        Cancel booking
      </Button>
    );
  }

  return null;
}

interface BookingListProps {
  bookings: BookingResponse[];
  role: 'trainer' | 'client';
}

export function BookingList({ bookings, role }: BookingListProps) {
  if (bookings.length === 0) {
    return <Typography color="text.secondary">No bookings yet.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="h6">{booking.instance.workoutTitle}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(booking.instance.scheduledAt).toLocaleString()}
                </Typography>
                {role === 'trainer' && (
                  <Typography variant="body2">Client: {booking.client.name}</Typography>
                )}
              </Box>
              <BookingStatusChip status={booking.status} />
            </Box>
            <BookingActions booking={booking} role={role} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
