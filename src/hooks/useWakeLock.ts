import { useEffect, useRef } from 'react';

/**
 * Keeps the mobile screen awake during active GPS runs using the Screen Wake Lock API.
 * Automatically re-acquires the wake lock when the app returns to foreground.
 */
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    let cancelled = false;

    const requestLock = async () => {
      try {
        if (active && document.visibilityState === 'visible' && !wakeLockRef.current) {
          const sentinel = await navigator.wakeLock.request('screen');
          if (cancelled) {
            await sentinel.release();
            return;
          }
          wakeLockRef.current = sentinel;
          sentinel.addEventListener('release', () => {
            if (wakeLockRef.current === sentinel) {
              wakeLockRef.current = null;
            }
          });
        }
      } catch {
        // Wake lock can fail if battery saver is active or tab is not visible
      }
    };

    const releaseLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignore release errors
        }
        wakeLockRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        requestLock();
      }
    };

    if (active) {
      requestLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      releaseLock();
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [active]);
}
