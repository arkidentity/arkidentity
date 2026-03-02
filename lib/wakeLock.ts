/**
 * Screen Wake Lock utility
 * Prevents screen from dimming/sleeping while journaling
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Request a screen wake lock
 * Returns true if successful, false otherwise
 */
export async function requestWakeLock(): Promise<boolean> {
  // Check if Wake Lock API is supported
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    console.log('[WakeLock] Wake Lock API not supported on this device');
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('[WakeLock] Screen wake lock acquired - screen will stay awake');

    // Listen for release (e.g., tab becomes inactive)
    wakeLock.addEventListener('release', () => {
      console.log('[WakeLock] Screen wake lock released');
      wakeLock = null;
    });

    return true;
  } catch (err) {
    const error = err as Error;
    console.log('[WakeLock] Wake Lock request failed:', error.message);
    return false;
  }
}

/**
 * Release the screen wake lock
 */
export async function releaseWakeLock(): Promise<void> {
  if (wakeLock !== null) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('[WakeLock] Screen wake lock released');
    } catch (err) {
      const error = err as Error;
      console.log('[WakeLock] Wake lock release failed:', error.message);
    }
  }
}

/**
 * Check if wake lock is currently active
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null;
}

/**
 * Handle visibility change - re-acquire wake lock when page becomes visible
 */
export async function handleVisibilityChange(): Promise<void> {
  if (document.visibilityState === 'visible' && wakeLock === null) {
    await requestWakeLock();
  }
}

/**
 * Initialize wake lock with visibility change handler
 * Call this when entering the journal page
 */
export function initWakeLock(): () => void {
  // Request initial wake lock
  requestWakeLock();

  // Add visibility change listener
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    releaseWakeLock();
  };
}
