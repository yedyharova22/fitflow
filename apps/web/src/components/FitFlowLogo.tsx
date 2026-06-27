'use client';

import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { Routes } from '@/consts/Pages';

interface FitFlowLogoProps {
  showWordmark?: boolean;
  size?: number;
}

function LogoMark({ size }: { size: number }) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#4f46e5" />
      <path
        d="M6 18.5C9 14.5 12 14.5 16 18.5C20 22.5 23 22.5 26 18.5"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 12.5C9 8.5 12 8.5 16 12.5C20 16.5 23 16.5 26 12.5"
        stroke="#c7d2fe"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </Box>
  );
}

export function FitFlowLogo({ showWordmark = true, size = 28 }: FitFlowLogoProps) {
  return (
    <Box
      component={Link}
      href={Routes.DASHBOARD}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        textDecoration: 'none',
        color: 'primary.main',
      }}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, lineHeight: 1 }}>
          FitFlow
        </Typography>
      )}
    </Box>
  );
}
