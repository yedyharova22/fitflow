'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/use-auth';
import { uploadAvatar, saveAvatar } from '@/features/profile/profile-api';
import { useProfile } from '@/features/profile/use-profile';
import ProfileForm from '@/features/profile/ProfileForm';
import { PushNotificationOptIn } from '@/features/notifications/PushNotificationOptIn';
import { AppNavBar } from '@/components/AppNavBar';
import { Routes } from '@/consts/Pages';

export default function ProfilePage() {
  const { user, isLoading: authLoading, signOut, setSession, accessToken } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const [avatar, setAvatar] = useState<string | null>(user?.profile?.avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setAvatar(profile?.avatarUrl ?? user?.profile?.avatarUrl ?? null);
  }, [profile, user]);

  if (authLoading || profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !profile) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, px: 2 }}>
        {profileError ? (
          <Alert severity="error">
            {profileError instanceof Error ? profileError.message : 'Failed to load profile'}
          </Alert>
        ) : (
          <Typography>Loading...</Typography>
        )}
      </Box>
    );
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && accessToken) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setUploading(true);
        setAvatarError(null);
        try {
          const { url } = await uploadAvatar(base64);
          setAvatar(url);
          const saved = await saveAvatar(url);
          setSession(accessToken, {
            ...user,
            profile: {
              name: user.profile?.name ?? 'User',
              avatarUrl: saved.avatarUrl,
              age: user.profile?.age ?? null,
              description: user.profile?.description ?? null,
            },
          });
        } catch {
          setAvatarError('Failed to upload image');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <AppNavBar />
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 2, px: 2, pb: 6 }}>
      <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          src={avatar || profile.avatarUrl || undefined}
          sx={{ width: 96, height: 96, mb: 2 }}
        >
          {profile.name?.charAt(0)}
        </Avatar>
        <Button variant="outlined" component="label" sx={{ mb: 2 }} disabled={uploading}>
          Upload Avatar
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </Button>
        {avatarError && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {avatarError}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {profile.email}
        </Typography>

        <ProfileForm profile={profile} />

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Browser notifications
          </Typography>
          <PushNotificationOptIn />
        </Box>

        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={async () => {
            await signOut();
            router.push(Routes.LOGIN);
          }}
          sx={{ mt: 3 }}
        >
          Log Out
        </Button>
        <Button variant="text" onClick={() => router.push(Routes.DASHBOARD)} sx={{ mt: 1 }}>
          Back to Dashboard
        </Button>
      </Paper>
      </Box>
    </>
  );
}
