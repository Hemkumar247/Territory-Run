import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

interface WakeLockSentinel {
  release(): Promise<void>;
  addEventListener(type: string, listener: () => void): void;
}

/**
 * Keeps the mobile screen awake during active GPS runs using the Screen Wake Lock API.
 * On native platforms, uses the Web Wake Lock API which works in Capacitor webviews.
 * Automatically re-acquires the wake lock when the app returns to foreground.
 */
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLockRef.current) {
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
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
        }
      } catch {
        // Ignore release errors
      }
      wakeLockRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        requestLock();
      }
    };

    requestLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [active, isNative]);
}