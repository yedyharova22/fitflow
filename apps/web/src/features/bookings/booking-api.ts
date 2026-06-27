import type {
  BookingListInput,
  BookingListResponse,
  BookingResponse,
  CreateBookingInput,
  UpdateBookingStatusInput,
} from '@fitflow/shared';
import { apiClient } from '@/lib/api-client';

export function listBookings(params?: BookingListInput): Promise<BookingListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.clientId) search.set('clientId', params.clientId);
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<BookingListResponse>(`/v1/bookings${qs ? `?${qs}` : ''}`);
}

export function createBooking(input: CreateBookingInput): Promise<BookingResponse> {
  return apiClient.post<BookingResponse>('/v1/bookings', input);
}

export function updateBookingStatus(id: string, input: UpdateBookingStatusInput): Promise<BookingResponse> {
  return apiClient.patch<BookingResponse>(`/v1/bookings/${id}`, input);
}

export function cancelBooking(id: string): Promise<BookingResponse> {
  return apiClient.patch<BookingResponse>(`/v1/bookings/${id}/cancel`, {});
}

export function attendBooking(id: string): Promise<BookingResponse> {
  return apiClient.patch<BookingResponse>(`/v1/bookings/${id}/attend`, {});
}
