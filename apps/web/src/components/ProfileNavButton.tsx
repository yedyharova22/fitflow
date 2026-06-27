'use client';

import Link from 'next/link';
import { Avatar, Button, Typography } from '@mui/material';
import { Routes } from '@/consts/Pages';
import { useAuth } from '@/features/auth/use-auth';

export function ProfileNavButton() {
  const { user } = useAuth();
  const name = user?.profile?.name ?? 'User';
  const avatarUrl = user?.profile?.avatarUrl ?? undefined;

  return (
    <Button
      component={Link}
      href={Routes.PROFILE}
      color="inherit"
      sx={{
        textTransform: 'none',
        ml: 0.5,
        gap: 1,
        px: { xs: 0.75, sm: 1.5 },
        minWidth: 0,
      }}
    >
      <Avatar src={avatarUrl} alt={name} sx={{ width: 32, height: 32, fontSize: 14 }}>
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Typography
        component="span"
        variant="body2"
        sx={{ fontWeight: 500 }}
      >
        Profile
      </Typography>
    </Button>
  );
}
