'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BookingListInput, CreateBookingInput, UpdateBookingStatusInput } from '@fitflow/shared';
import {
  attendBooking,
  cancelBooking,
  createBooking,
  listBookings,
  updateBookingStatus,
} from './booking-api';

export const BOOKINGS_QUERY_KEY = ['bookings'] as const;

export function useBookings(params?: BookingListInput) {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEY, params ?? {}],
    queryFn: () => listBookings(params),
    staleTime: 30_000,
    networkMode: 'offlineFirst',
  });
}

export function useBookingMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
  };

  const create = useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookingStatusInput }) =>
      updateBookingStatus(id, input),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: invalidate,
  });

  const attend = useMutation({
    mutationFn: (id: string) => attendBooking(id),
    onSuccess: invalidate,
  });

  return { create, updateStatus, cancel, attend };
}
