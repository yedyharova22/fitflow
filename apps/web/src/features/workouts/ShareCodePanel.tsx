'use client';

import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

interface ShareCodePanelProps {
  shareCode: string;
}

export default function ShareCodePanel({ shareCode }: ShareCodePanelProps) {
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${shareCode}`
      : `/join/${shareCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl);
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Share workout
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Clients can scan the QR code or use the link to view sessions and book.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <QRCodeSVG value={joinUrl} size={160} />
      </Box>
      <TextField fullWidth label="Share code" value={shareCode} InputProps={{ readOnly: true }} sx={{ mb: 1 }} />
      <TextField fullWidth label="Join link" value={joinUrl} InputProps={{ readOnly: true }} sx={{ mb: 2 }} />
      <Button variant="contained" onClick={copyLink}>
        Copy link
      </Button>
    </Paper>
  );
}
