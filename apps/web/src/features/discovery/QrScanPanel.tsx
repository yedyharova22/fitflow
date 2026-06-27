'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography } from '@mui/material';
import { Routes } from '@/consts/Pages';

function extractShareCode(raw: string): string {
  const trimmed = raw.trim();
  const joinMatch = trimmed.match(/\/join\/([^/?#]+)/i);
  if (joinMatch?.[1]) return joinMatch[1];
  return trimmed;
}

export function QrScanPanel() {
  const router = useRouter();
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const navigateToCode = (raw: string) => {
    const code = extractShareCode(raw);
    if (!code) return;
    void scannerRef.current?.stop();
    router.push(Routes.JOIN(code));
  };

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            navigateToCode(decoded);
          },
          () => {
            // ignore scan failures between frames
          },
        );

        if (cancelled) {
          await scanner.stop();
        }
      } catch {
        if (!cancelled) {
          setCameraError('Camera access unavailable. Enter a share code manually below.');
          setScanning(false);
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      void scannerRef.current?.stop();
      scannerRef.current = null;
    };
  }, [scanning]);

  return (
    <Box>
      {scanning && !cameraError && (
        <Box
          id="qr-reader"
          sx={{
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
            mb: 3,
            '& video': { borderRadius: 1 },
          }}
        />
      )}

      {cameraError && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {cameraError}
        </Typography>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Or enter share code manually
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, maxWidth: 400 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="e.g. DEMO2026"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && manualCode.trim()) {
              navigateToCode(manualCode);
            }
          }}
        />
        <Button
          variant="contained"
          onClick={() => navigateToCode(manualCode)}
          disabled={!manualCode.trim()}
        >
          Go
        </Button>
      </Box>
    </Box>
  );
}
