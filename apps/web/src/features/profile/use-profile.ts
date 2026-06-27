'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser, ProfileResponse, UpdateProfileInput, UserRole } from '@fitflow/shared';
import { useAuth } from '@/features/auth/use-auth';
import { getProfile, updateProfile } from './profile-api';

export const PROFILE_QUERY_KEY = ['profile'] as const;

function profileToAuthUser(profile: ProfileResponse): AuthUser {
  return {
    id: profile.id,
    role: profile.role as UserRole,
    email: profile.email,
    legacyRole: profile.legacyRole,
    profile: {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      age: profile.age,
      description: profile.description,
    },
  };
}

export function useProfile() {
  const { accessToken, setSession } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      if (accessToken) {
        setSession(accessToken, profileToAuthUser(profile));
      }
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}
