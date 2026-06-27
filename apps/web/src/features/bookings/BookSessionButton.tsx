'use client';

import { Button, CircularProgress } from '@mui/material';
import { useAuth } from '@/features/auth/use-auth';
import { useRouter } from 'next/navigation';
import { useBookingMutations } from '@/features/bookings/use-bookings';
import { Routes } from '@/consts/Pages';

interface BookSessionButtonProps {
  instanceId: string;
}

export default function BookSessionButton({ instanceId }: BookSessionButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { create } = useBookingMutations();

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push(`${Routes.LOGIN}?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    await create.mutateAsync({ workoutInstanceId: instanceId });
    router.push(Routes.BOOKINGS);
  };

  return (
    <Button variant="contained" size="small" disabled={create.isPending} onClick={handleBook}>
      {create.isPending ? <CircularProgress size={20} /> : 'Book session'}
    </Button>
  );
}
