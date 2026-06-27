'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Routes } from '@/consts/Pages';
import { useAuth } from '@/features/auth/use-auth';
import { login } from '@/features/auth/auth-api';
import { getDeviceId } from '@/lib/device-id';

export default function LoginForm() {
  const router = useRouter();
  const { setSession, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const deviceId = getDeviceId() || undefined;

    setIsLoading(true);
    setError(null);

    try {
      const result = await login({ email, password, deviceId });
      setSession(result.accessToken, result.user);
      router.replace(Routes.DASHBOARD);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitting = isLoading || authLoading;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            type="email"
            required
            margin="normal"
            autoComplete="email"
            disabled={submitting}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            required
            margin="normal"
            autoComplete="current-password"
            disabled={submitting}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Sign in'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Don&apos;t have an account? <Link href={Routes.REGISTER}>Register</Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
