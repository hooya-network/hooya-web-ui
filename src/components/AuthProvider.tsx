'use client';

import React, { useEffect } from 'react';
import { startTokenRefreshTimer, ensureValidToken } from '@/utils/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // validate and refresh token on app startup
    ensureValidToken().then((isValid) => {
      if (isValid) {
        startTokenRefreshTimer(); // start proactive refresh
      }
    });

    // cleanup on unmount
    return () => {
      // don't stop timer on unmount since this is the root provider
      // timer will be stopped by logout function when needed
    };
  }, []);

  return <>{children}</>;
}
