'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { register as registerApi } from '@/features/auth/auth-api';

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4f46e5 30%, #7c3aed 90%)',
  padding: theme.spacing(4),
  textAlign: 'center',
  color: 'white',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: theme.shadows[4],
}));

const RoleToggleButton = styled(ToggleButton)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'trainer' | 'client'>('trainer');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role,
    };

    try {
      await registerApi(data);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRole: 'trainer' | 'client' | null,
  ) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 50%, #fdf2f8 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <StyledPaper>
          <GradientBox>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Create Account
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Join our fitness community
            </Typography>
          </GradientBox>

          <Box sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name"
                  required
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  required
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  required
                  variant="outlined"
                  helperText="Password must be at least 8 characters long"
                />

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    I am a:
                  </Typography>
                  <ToggleButtonGroup
                    value={role}
                    exclusive
                    onChange={handleRoleChange}
                    aria-label="user role"
                    sx={{ justifyContent: 'center' }}
                  >
                    <RoleToggleButton value="trainer" aria-label="trainer">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FitnessCenterIcon />
                        <Typography>Trainer</Typography>
                      </Stack>
                    </RoleToggleButton>
                    <RoleToggleButton value="client" aria-label="client">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon />
                        <Typography>Client</Typography>
                      </Stack>
                    </RoleToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Stack>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  href="/login"
                  style={{
                    color: '#4f46e5',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </StyledPaper>
      </motion.div>
    </Box>
  );
}
