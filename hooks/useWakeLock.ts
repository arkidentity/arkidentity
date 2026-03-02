'use client';

/**
 * React hook for screen wake lock
 * Keeps the screen on while journaling
 */

import { useEffect, useRef, useCallback } from 'react';
import { requestWakeLock, releaseWakeLock, isWakeLockActive } from '@/lib/wakeLock';

export interface UseWakeLockReturn {
  /** Request the wake lock */
  request: () => Promise<boolean>;
  /** Release the wake lock */
  release: () => Promise<void>;
  /** Check if wake lock is currently active */
  isActive: () => boolean;
}

/**
 * Hook that manages screen wake lock
 * Automatically acquires wake lock on mount and releases on unmount
 * Also handles visibility change to re-acquire when page becomes visible
 *
 * @param autoAcquire - Whether to automatically acquire wake lock on mount (default: true)
 *
 * @example
 * ```tsx
 * function JournalPage() {
 *   // Wake lock is automatically acquired when component mounts
 *   const { isActive } = useWakeLock();
 *
 *   return <div>Wake lock active: {isActive() ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useWakeLock(autoAcquire: boolean = true): UseWakeLockReturn {
  const hasRequestedRef = useRef(false);

  // Handle visibility change - re-acquire when page becomes visible
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible' && hasRequestedRef.current && !isWakeLockActive()) {
      console.log('[useWakeLock] Page visible, re-acquiring wake lock');
      await requestWakeLock();
    }
  }, []);

  useEffect(() => {
    if (!autoAcquire) return;

    // Request wake lock on mount
    const acquire = async () => {
      hasRequestedRef.current = true;
      await requestWakeLock();
    };

    acquire();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
      hasRequestedRef.current = false;
    };
  }, [autoAcquire, handleVisibilityChange]);

  return {
    request: async () => {
      hasRequestedRef.current = true;
      return requestWakeLock();
    },
    release: async () => {
      hasRequestedRef.current = false;
      return releaseWakeLock();
    },
    isActive: isWakeLockActive,
  };
}
