'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { initializeAuth, refreshToken, logoutUser } from '@/lib/features/auth/authSlice';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuthCheck({ requireAuth = true, redirectTo = '/login' }: UseAuthOptions = {}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const isInitialized = useRef(false);
  
  const { accessToken, refreshToken: storedRefreshToken, isAuthenticated, isLoading: reduxIsLoading, expiresAt } = 
    useAppSelector((state) => state.auth);

  // Initialize auth state on mount only once
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      dispatch(initializeAuth());
    }
  }, [dispatch]);

  // Mark as complete once Redux has finished loading
  useEffect(() => {
    if (!reduxIsLoading) {
      const timer = setTimeout(() => setIsAuthCheckComplete(true), 100);
      return () => clearTimeout(timer);
    }
  }, [reduxIsLoading]);

  // Function to attempt token refresh
  const attemptRefresh = useCallback(async () => {
    if (!storedRefreshToken) return false;

    try {
      const result = await dispatch(refreshToken());
      return refreshToken.fulfilled.match(result);
    } catch {
      return false;
    }
  }, [dispatch, storedRefreshToken]);

  // Check and refresh token
  useEffect(() => {
    if (!isAuthCheckComplete || reduxIsLoading) return;

    const checkAuth = async () => {
      // If not authenticated and auth is required, redirect
      if (requireAuth && !isAuthenticated) {
        if (storedRefreshToken) {
          const refreshed = await attemptRefresh();
          if (refreshed) {
            return; // Refresh succeeded, don't redirect
          }
        }
        router.push(redirectTo);
        return;
      }

      // If authenticated, check if token is about to expire (within 5 minutes)
      if (isAuthenticated && expiresAt) {
        const timeUntilExpiry = expiresAt - Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
          // Token is about to expire, try to refresh
          const refreshed = await attemptRefresh();
          if (!refreshed) {
            // Refresh failed, logout
            await dispatch(logoutUser());
            router.push(redirectTo);
          }
        }
      }
    };

    checkAuth();
  }, [isAuthCheckComplete, reduxIsLoading, isAuthenticated, expiresAt, requireAuth, redirectTo, router, dispatch, attemptRefresh, storedRefreshToken]);

  // Function to manually check and refresh token
  const ensureValidToken = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    // Check if token is expired or about to expire
    if (expiresAt && Date.now() >= expiresAt - 60000) {
      // Token is expired or about to expire, refresh it
      const refreshed = await attemptRefresh();
      return refreshed;
    }

    return true;
  }, [isAuthenticated, expiresAt, attemptRefresh]);

  return {
    isAuthenticated,
    isLoading: !isAuthCheckComplete || reduxIsLoading,
    accessToken,
    ensureValidToken,
  };
}

// Hook to get a valid access token (refreshes if needed)
export function useValidToken() {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) {
      router.push('/login');
      return null;
    }

    try {
      const result = await dispatch(refreshToken());
      if (refreshToken.fulfilled.match(result)) {
        return result.payload.accessToken;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }

    return accessToken;
  }, [accessToken, isAuthenticated, dispatch, router]);

  return { getValidToken, accessToken };
}
