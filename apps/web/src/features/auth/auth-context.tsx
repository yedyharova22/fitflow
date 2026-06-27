'use client';

import { createContext } from 'react';
import type { AuthUser } from '@fitflow/shared';

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signOut: () => void;
  setSession: (accessToken: string, user: AuthUser) => void;
  retryDeviceAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
