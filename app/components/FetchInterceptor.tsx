'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks';
import { logoutUser } from '@/lib/features/auth/authSlice';

export function FetchInterceptor({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // If we receive a 401 Unauthorized, handle logout and redirect
      if (response.status === 401) {
        // Prevent redirecting if already on a public/auth path
        const publicPaths = ['/login', '/signup', '/', '/coming-soon', '/download-app'];
        const isPublicPath = publicPaths.includes(pathname);
        
        if (!isPublicPath) {
          // Clear auth state
          dispatch(logoutUser());
          // Redirect to login page
          router.push('/login');
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router, dispatch, pathname]);

  return <>{children}</>;
}
