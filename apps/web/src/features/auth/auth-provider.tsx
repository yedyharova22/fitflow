'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthUser } from '@fitflow/shared';
import { clearDeviceId } from '@/lib/device-id';
import {
  setAccessTokenGetter,
  setAuthFailureHandler,
  setTokenRefreshedHandler,
} from '@/lib/api-client';
import { AuthContext } from './auth-context';
import {
  getMe,
  logout as logoutApi,
  restoreSessionFromCookies,
} from './auth-api';
import { Routes } from '@/consts/Pages';

interface AuthProviderProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = [Routes.LOGIN, Routes.REGISTER, '/join'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  const sessionExpiredRef = useRef(false);
  const handlingAuthFailureRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  const redirectToLogin = useCallback(() => {
    if (isPublicPath(pathnameRef.current)) {
      return;
    }
    router.replace(Routes.LOGIN);
  }, [router]);

  const handleAuthFailure = useCallback(async () => {
    if (handlingAuthFailureRef.current) {
      return;
    }
    handlingAuthFailureRef.current = true;
    sessionExpiredRef.current = true;

    clearSession();
    try {
      await logoutApi();
    } catch {
      // Cookies may already be cleared by the API.
    }
    redirectToLogin();
    handlingAuthFailureRef.current = false;
  }, [clearSession, redirectToLogin]);

  const setSession = useCallback((token: string, sessionUser: AuthUser) => {
    sessionExpiredRef.current = false;
    accessTokenRef.current = token;
    setAccessToken(token);
    setUser(sessionUser);
    setError(null);
  }, []);

  const bootstrap = useCallback(async () => {
    if (sessionExpiredRef.current && !isPublicPath(pathname)) {
      setIsLoading(false);
      return;
    }

    if (accessTokenRef.current && user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const isPublic = isPublicPath(pathname);

    try {
      if (accessTokenRef.current) {
        const me = await getMe();
        setSession(accessTokenRef.current, me.user);
        return;
      }

      const session = await restoreSessionFromCookies();
      setSession(session.accessToken, session.user);
      return;
    } catch {
      if (isPublic) {
        clearSession();
        return;
      }

      await handleAuthFailure();
    } finally {
      setIsLoading(false);
    }
  }, [pathname, setSession, user, clearSession, handleAuthFailure]);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearDeviceId();
    clearSession();
    setError(null);
    redirectToLogin();
  }, [clearSession, redirectToLogin]);

  useEffect(() => {
    setAccessTokenGetter(() => accessTokenRef.current);
    setTokenRefreshedHandler((token) => {
      accessTokenRef.current = token;
      setAccessToken(token);
    });
    setAuthFailureHandler(() => {
      void handleAuthFailure();
    });
  }, [handleAuthFailure]);

  useEffect(() => {
    void bootstrap();
  }, [pathname, bootstrap]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        error,
        signOut,
        setSession,
        retryDeviceAuth: bootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
