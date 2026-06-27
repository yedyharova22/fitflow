'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppNavBar } from '@/components/AppNavBar';
import { QrScanPanel } from '@/features/discovery/QrScanPanel';
import { Routes } from '@/consts/Pages';

export default function DiscoverScanPage() {
  return (
    <>
      <AppNavBar />
      <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, pb: 6 }}>
        <Button
          component={Link}
          href={Routes.DISCOVER}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2 }}
        >
          Back to Discover
        </Button>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Scan workout QR
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Point your camera at a workout QR code, or enter the share code manually.
        </Typography>
        <QrScanPanel />
      </Box>
    </>
  );
}
