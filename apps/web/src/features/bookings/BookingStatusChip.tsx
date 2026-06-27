'use client';

import { Chip } from '@mui/material';
import type { BookingResponse } from '@fitflow/shared';

const STATUS_COLOR: Record<BookingResponse['status'], 'warning' | 'success' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  CANCELED: 'default',
};

export default function BookingStatusChip({ status }: { status: BookingResponse['status'] }) {
  return <Chip size="small" label={status} color={STATUS_COLOR[status]} />;
}
