import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Coordinate } from '../types';
import { capacitorGPS, LocationUpdate } from '../services/capacitorGPS';
import { LocationAccess, locationGranted } from '../lib/locationAccess';
import { shouldAppendTrailPoint, shouldUpdateFix, trailDistanceMeters } from '../lib/trailFilter';
import { clearActiveRun, loadActiveRun, loadLastFix, saveActiveRun, saveLastFix, StoredRun } from '../services/activeRunStore';

interface LocationState {
  currentLocation: Coordinate | null;
  accuracy: number | null;
  trail: (Coordinate & { timestamp: number })[];
  error: string | null;
  isTracking: boolean;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedTime: number;
  totalDistanceCovered: number;
  permission: LocationAccess | 'checking';
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  endRun: () => void;
  resetRun: () => void;
  simulateRun: () => void;
  requestPermission: () => Promise<LocationAccess>;
}

const isNative = Capacitor.isNativePlatform();

type TrailPoint = Coordinate & { timestamp: number };

function bootRun(): StoredRun | null {
  return loadActiveRun();
}

export function useLocation(): LocationState {
  const restored = useRef<StoredRun | null | undefined>(undefined);
  if (restored.current === undefined) restored.current = bootRun();
  const cachedFix = useRef(loadLastFix());

  const [state, setState] = useState<Omit<LocationState, 'startRun' | 'pauseRun' | 'resumeRun' | 'endRun' | 'resetRun' | 'simulateRun' | 'requestPermission'>>(() => {
    const run = restored.current;
    const last = run?.trail[run.trail.length - 1];
    const fix = cachedFix.current;
    return {
      currentLocation: last ? { lat: last.lat, lng: last.lng } : fix ? { lat: fix.lat, lng: fix.lng } : null,
      accuracy: fix?.accuracy ?? null,
      trail: run?.trail ?? [],
      error: null,
      isTracking: false,
      isRunning: !!run,
      isPaused: !!run?.paused,
      startTime: run?.startedAt ?? null,
      elapsedTime: 0,
      totalDistanceCovered: run ? trailDistanceMeters(run.trail) / 1000 : 0,
      permission: 'checking',
    };
  });

  const isRunningRef = useRef(!!restored.current);
  const isPausedRef = useRef(!!restored.current?.paused);
  const isSimulatingRef = useRef(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processUpdateRef = useRef<((location: LocationUpdate) => void) | null>(null);
  const watchingRef = useRef(false);
  const sessionRef = useRef(0);
  const fixRef = useRef<{ lat: number; lng: number; accuracy: number; timestamp: number } | null>(
    cachedFix.current
      ? { lat: cachedFix.current.lat, lng: cachedFix.current.lng, accuracy: cachedFix.current.accuracy, timestamp: cachedFix.current.timestamp }
      : null
  );
  const trailRef = useRef<TrailPoint[]>(restored.current?.trail ?? []);
  const distanceRef = useRef(restored.current ? trailDistanceMeters(restored.current.trail) : 0);
  const persistTimer = useRef<number | null>(null);
  // Wall-clock based timer: setInterval is throttled/paused while the screen is off, so never count ticks.
  const clockRef = useRef({
    pausedMs: restored.current?.pausedMs ?? 0,
    pausedAt: restored.current?.paused ? Date.now() : 0,
  });
  const startedAtRef = useRef<number | null>(restored.current?.startedAt ?? null);

  const flushRun = useCallback(() => {
    if (persistTimer.current) {
      window.clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
    if (!isRunningRef.current || isSimulatingRef.current) return;
    if (!startedAtRef.current) return;
    saveActiveRun({
      active: true,
      paused: isPausedRef.current,
      startedAt: startedAtRef.current,
      pausedMs: clockRef.current.pausedMs,
      trail: trailRef.current,
    });
  }, []);

  const schedulePersist = useCallback(() => {
    if (persistTimer.current || isSimulatingRef.current || !isRunningRef.current) return;
    persistTimer.current = window.setTimeout(() => {
      persistTimer.current = null;
      flushRun();
    }, 400);
  }, [flushRun]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        const { pausedMs } = clockRef.current;
        setState(s => (s.startTime ? { ...s, elapsedTime: Math.max(0, Math.floor((Date.now() - s.startTime - pausedMs) / 1000)) } : s));
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state.isRunning, state.isPaused]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushRun();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushRun);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushRun);
    };
  }, [flushRun]);

  const applyFix = useCallback((location: LocationUpdate) => {
    const accuracy = typeof location.accuracy === 'number' && Number.isFinite(location.accuracy) ? location.accuracy : 150;
    const candidate = { lat: location.latitude, lng: location.longitude, accuracy, timestamp: location.timestamp || Date.now() };
    if (!shouldUpdateFix(fixRef.current, candidate)) return;
    fixRef.current = candidate;
    saveLastFix(candidate);
    setState(prev => ({
      ...prev,
      currentLocation: { lat: candidate.lat, lng: candidate.lng },
      accuracy,
      isTracking: true,
      error: null,
    }));
  }, []);

  const processLocationUpdate = useCallback((location: LocationUpdate) => {
    if (isSimulatingRef.current) return;
    applyFix(location);

    if (!isRunningRef.current || isPausedRef.current) return;

    const accuracy = typeof location.accuracy === 'number' && Number.isFinite(location.accuracy) ? location.accuracy : 999;
    const point = {
      lat: location.latitude,
      lng: location.longitude,
      timestamp: location.timestamp || Date.now(),
      accuracy,
    };
    const previous = trailRef.current[trailRef.current.length - 1];
    const decision = shouldAppendTrailPoint(previous, point);
    if (!decision.accept) return;

    const nextPoint: TrailPoint = { lat: point.lat, lng: point.lng, timestamp: point.timestamp };
    trailRef.current = [...trailRef.current, nextPoint];
    distanceRef.current += decision.distanceMeters;
    const km = distanceRef.current / 1000;
    setState(prev => ({
      ...prev,
      currentLocation: { lat: point.lat, lng: point.lng },
      accuracy,
      trail: trailRef.current,
      isTracking: true,
      error: null,
      totalDistanceCovered: km,
    }));
    schedulePersist();
  }, [applyFix, schedulePersist]);

  const beginWatching = useCallback(async () => {
    if (watchingRef.current) return;
    const session = sessionRef.current;
    const stale = () => session !== sessionRef.current;
    watchingRef.current = true;
    processUpdateRef.current = processLocationUpdate;

    const handleError = (error: Error) => {
      if (isSimulatingRef.current) return;
      const message = /not enabled|disabled/i.test(error.message)
        ? 'Location is turned off. Turn it on to see where you are.'
        : (error.message || 'An unknown error occurred');
      setState(s => ({ ...s, error: message, isTracking: false }));
    };

    if (isNative) {
      capacitorGPS.setConfig({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        distanceFilter: 0,
      });

      // A cached or network fix centers the map immediately. The GPS fix replaces it when it is better.
      try {
        const quick = await capacitorGPS.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 });
        processLocationUpdate(quick);
      } catch {
        // No cached fix. The precise request below still runs.
      }
      try {
        const precise = await capacitorGPS.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
        processLocationUpdate(precise);
      } catch (error) {
        handleError(error as Error);
      }

      if (stale()) {
        watchingRef.current = false;
        return;
      }
      await capacitorGPS.startWatching(
        processLocationUpdate,
        handleError,
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, minimumUpdateInterval: 1000, interval: 1000 }
      );
      if (stale()) {
        await capacitorGPS.stopWatching().catch(() => undefined);
        watchingRef.current = false;
        return;
      }

      if (isRunningRef.current && !isPausedRef.current) {
        capacitorGPS.startBackgroundTracking(
          (loc) => processUpdateRef.current?.(loc),
          (err) => setState(s => ({ ...s, error: err.message }))
        );
      }
      return;
    }

    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocation is not supported by your browser', isTracking: false }));
      watchingRef.current = false;
      return;
    }
    if (stale()) {
      watchingRef.current = false;
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        processLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        if (isSimulatingRef.current) return;
        let errorMessage = 'An unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Allow location to center the map on you.';
            setState(s => ({ ...s, permission: 'denied', error: errorMessage, isTracking: false }));
            return;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setState(s => ({ ...s, error: errorMessage, isTracking: false }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        processLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [processLocationUpdate]);

  const requestPermission = useCallback(async (): Promise<LocationAccess> => {
    const access = await capacitorGPS.requestPermissions();
    setState(s => ({
      ...s,
      permission: access,
      error: access === 'disabled'
        ? 'Location is turned off. Turn it on to see where you are.'
        : access === 'denied'
          ? 'Location permission denied. Allow location to center the map on you.'
          : s.error,
    }));
    if (locationGranted(access)) {
      await beginWatching();
    }
    return access;
  }, [beginWatching]);

  useEffect(() => {
    let cancelled = false;
    let webCleanup: (() => void) | undefined;

    const rememberCleanup = (cleanup: void | (() => void)) => {
      if (typeof cleanup === 'function') webCleanup = cleanup;
    };

    const setupGPS = async () => {
      const existing = await capacitorGPS.checkAccess().catch(() => 'prompt' as LocationAccess);
      if (cancelled) return;

      if (locationGranted(existing)) {
        setState(s => ({ ...s, permission: existing, error: null }));
        rememberCleanup(await beginWatching());
        if (cancelled) webCleanup?.();
        return;
      }

      // Login, signup, and every return to the map ask here until the user allows location.
      const access = await capacitorGPS.requestPermissions();
      if (cancelled) return;
      setState(s => ({
        ...s,
        permission: access,
        error: access === 'disabled'
          ? 'Location is turned off. Turn it on to see where you are.'
          : access === 'denied'
            ? 'Location permission denied. Allow location to center the map on you.'
            : null,
      }));
      if (locationGranted(access)) {
        rememberCleanup(await beginWatching());
        if (cancelled) webCleanup?.();
      }
    };

    setupGPS();

    return () => {
      cancelled = true;
      sessionRef.current += 1;
      webCleanup?.();
      if (isNative) {
        capacitorGPS.stopWatching().catch(() => undefined);
        if (!isRunningRef.current) capacitorGPS.stopBackgroundTracking().catch(() => undefined);
      }
      watchingRef.current = false;
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      flushRun();
    };
  }, [beginWatching, flushRun]);

  const startRun = useCallback(() => {
    isRunningRef.current = true;
    isPausedRef.current = false;
    isSimulatingRef.current = false;
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    clockRef.current = { pausedMs: 0, pausedAt: 0 };
    startedAtRef.current = Date.now();
    distanceRef.current = 0;

    const fix = fixRef.current;
    const fresh = fix && Date.now() - fix.timestamp < 30000 && fix.accuracy > 0 && fix.accuracy <= 40;
    const seed: TrailPoint[] = fresh ? [{ lat: fix.lat, lng: fix.lng, timestamp: fix.timestamp }] : [];
    trailRef.current = seed;

    if (isNative) {
      capacitorGPS.startBackgroundTracking((loc) => processUpdateRef.current?.(loc), (err) =>
        setState(s => ({ ...s, error: err.message }))
      );
    }
    flushRun();

    setState(s => ({
      ...s,
      isRunning: true,
      isPaused: false,
      startTime: startedAtRef.current,
      elapsedTime: 0,
      totalDistanceCovered: 0,
      trail: seed,
      error: null,
    }));
  }, [flushRun]);

  const pauseRun = useCallback(() => {
    isPausedRef.current = true;
    clockRef.current.pausedAt = Date.now();
    // Paused runs do not need GPS. Resume starts the foreground service again from the open app.
    if (isNative) capacitorGPS.stopBackgroundTracking().catch(() => undefined);
    flushRun();
    setState(s => ({ ...s, isPaused: true }));
  }, [flushRun]);

  const resumeRun = useCallback(() => {
    isPausedRef.current = false;
    if (clockRef.current.pausedAt) clockRef.current.pausedMs += Date.now() - clockRef.current.pausedAt;
    clockRef.current.pausedAt = 0;
    if (isNative) {
      capacitorGPS.startBackgroundTracking((loc) => processUpdateRef.current?.(loc), (err) =>
        setState(s => ({ ...s, error: err.message }))
      );
    }
    flushRun();
    setState(s => ({ ...s, isPaused: false }));
  }, [flushRun]);

  const simulateRun = useCallback(() => {
    setState(s => {
      const baseLocation = s.currentLocation || { lat: 37.7749, lng: -122.4194 };
      const startLocation = {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.005,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.005,
      };

      isSimulatingRef.current = true;
      isRunningRef.current = true;
      isPausedRef.current = false;
      clockRef.current = { pausedMs: 0, pausedAt: 0 };
      startedAtRef.current = Date.now();

      let currentLat = startLocation.lat;
      let currentLng = startLocation.lng;
      let step = 0;

      const turnRate = 3 + Math.random() * 5;
      const randomBaseAngle = Math.random() * Math.PI * 2;
      const speed = 0.00003 + Math.random() * 0.00002;

      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

      simulationIntervalRef.current = setInterval(() => {
        if (!isRunningRef.current) {
          if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
          isSimulatingRef.current = false;
          return;
        }

        if (isPausedRef.current) return;

        const angle = (step * turnRate) * (Math.PI / 180) + randomBaseAngle;
        currentLat += Math.cos(angle) * speed + (Math.random() - 0.5) * 0.000005;
        currentLng += Math.sin(angle) * speed + (Math.random() - 0.5) * 0.000005;

        const newCoord = { lat: currentLat, lng: currentLng };
        const newTrailPoint = { ...newCoord, timestamp: Date.now() };
        trailRef.current = [...trailRef.current, newTrailPoint];

        setState(prev => ({
          ...prev,
          currentLocation: newCoord,
          trail: trailRef.current,
          isRunning: true,
        }));

        step++;
      }, 1000);

      const seed = [{ ...startLocation, timestamp: Date.now() }];
      trailRef.current = seed;
      return {
        ...s,
        currentLocation: startLocation,
        isRunning: true,
        isPaused: false,
        startTime: startedAtRef.current,
        elapsedTime: 0,
        trail: seed,
        error: null,
        totalDistanceCovered: 0,
      };
    });
  }, []);

  const endRun = useCallback(() => {
    capacitorGPS.stopBackgroundTracking().catch(() => undefined);
    isRunningRef.current = false;
    isPausedRef.current = false;
    isSimulatingRef.current = false;
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    clearActiveRun();

    setState(s => {
      const km = trailDistanceMeters(s.trail) / 1000;
      return { ...s, isRunning: false, isPaused: false, totalDistanceCovered: km };
    });
  }, []);

  const resetRun = useCallback(() => {
    capacitorGPS.stopBackgroundTracking().catch(() => undefined);
    isRunningRef.current = false;
    isPausedRef.current = false;
    isSimulatingRef.current = false;
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    clockRef.current = { pausedMs: 0, pausedAt: 0 };
    startedAtRef.current = null;
    trailRef.current = [];
    distanceRef.current = 0;
    clearActiveRun();
    setState(s => ({ ...s, trail: [], isRunning: false, isPaused: false, startTime: null, elapsedTime: 0, totalDistanceCovered: 0 }));
  }, []);

  return { ...state, startRun, pauseRun, resumeRun, endRun, resetRun, simulateRun, requestPermission };
}
