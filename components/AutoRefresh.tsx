'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Under 10s so a new guest message shows up within 10s even counting the request itself.
const REFRESH_INTERVAL_MS = 8000;

// Re-runs the page's server query on a timer so new messages appear without a manual reload.
// Client state (e.g. a half-typed reply) survives a refresh.
export const AutoRefresh = () => {
  const router = useRouter();

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };

    const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [router]);

  return null;
};
