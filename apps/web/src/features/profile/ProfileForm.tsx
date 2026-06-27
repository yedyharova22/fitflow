'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UpdateProfileSchema, type ProfileResponse } from '@fitflow/shared';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useProfile } from './use-profile';

const CoachLocationMap = dynamic(() => import('./CoachLocationMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

const DEFAULT_LAT = 50.4501;
const DEFAULT_LNG = 30.5234;

const ProfileFormSchema = UpdateProfileSchema.extend({
  name: z.string().min(1, 'Name is required').max(100),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

interface ProfileFormProps {
  profile: ProfileResponse;
}

function toFormValues(profile: ProfileResponse): ProfileFormValues {
  const isTrainer = profile.legacyRole === 'trainer';
  return {
    name: profile.name,
    age: profile.age,
    description: profile.description,
    latitude: isTrainer ? (profile.latitude ?? DEFAULT_LAT) : profile.latitude,
    longitude: isTrainer ? (profile.longitude ?? DEFAULT_LNG) : profile.longitude,
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const { updateProfile, isUpdating, updateError } = useProfile();
  const isTrainer = profile.legacyRole === 'trainer';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: toFormValues(profile),
  });

  useEffect(() => {
    reset(toFormValues(profile));
  }, [profile, reset]);

  const latitude = watch('latitude');
  const longitude = watch('longitude');

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfile({
      name: values.name,
      age: values.age ?? null,
      description: values.description ?? null,
      latitude: isTrainer ? (values.latitude ?? null) : undefined,
      longitude: isTrainer ? (values.longitude ?? null) : undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Edit profile
      </Typography>

      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateError instanceof Error ? updateError.message : 'Failed to save profile'}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Name"
        margin="normal"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
      />

      <TextField
        fullWidth
        label="Age"
        type="number"
        margin="normal"
        {...register('age', {
          setValueAs: (value) => {
            if (value === '' || value == null) return null;
            const parsed = Number(value);
            return Number.isNaN(parsed) ? null : parsed;
          },
        })}
        error={!!errors.age}
        helperText={errors.age?.message}
      />

      <TextField
        fullWidth
        label="Description"
        margin="normal"
        multiline
        minRows={3}
        {...register('description', {
          setValueAs: (value) => (value === '' ? null : value),
        })}
        error={!!errors.description}
        helperText={errors.description?.message}
      />

      {isTrainer && (
        <Box sx={{ mt: 2 }}>
          <CoachLocationMap
            latitude={latitude ?? null}
            longitude={longitude ?? null}
            onChange={(lat, lng) => {
              setValue('latitude', lat, { shouldDirty: true });
              setValue('longitude', lng, { shouldDirty: true });
            }}
          />
        </Box>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isUpdating || !isDirty}
        sx={{ mt: 3 }}
      >
        {isUpdating ? <CircularProgress size={24} /> : 'Save profile'}
      </Button>
    </Box>
  );
}
