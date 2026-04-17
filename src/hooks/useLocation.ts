import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinate } from '../types';
import * as turf from '@turf/turf';

interface LocationState {
  currentLocation: Coordinate | null;
  trail: (Coordinate & { timestamp: number })[];
  error: string | null;
  isTracking: boolean;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedTime: number;
  totalDistanceCovered: number;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  endRun: () => void;
  resetRun: () => void;
  simulateRun: () => void;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<Omit<LocationState, 'startRun' | 'pauseRun' | 'resumeRun' | 'endRun' | 'resetRun' | 'simulateRun'>>({
    currentLocation: null,
    trail: [],
    error: null,
    isTracking: false,
    isRunning: false,
    isPaused: false,
    startTime: null,
    elapsedTime: 0,
    totalDistanceCovered: 0,
  });

  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const isSimulatingRef = useRef(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setState(s => ({ ...s, elapsedTime: s.elapsedTime + 1 }));
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state.isRunning, state.isPaused]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState((s) => ({ ...s, isTracking: true }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (isSimulatingRef.current) return; // Ignore real GPS if simulating
        
        const { latitude, longitude } = position.coords;
        const newCoord = { lat: latitude, lng: longitude };
        
        setState((prev) => {
          const newTrailPoint = { ...newCoord, timestamp: Date.now() };
          return {
            ...prev,
            currentLocation: newCoord,
            trail: isRunningRef.current && !isPausedRef.current ? [...prev.trail, newTrailPoint] : prev.trail,
            error: null,
          };
        });
      },
      (error) => {
        if (isSimulatingRef.current) return;
        
        let errorMessage = 'An unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable GPS.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setState((s) => ({ ...s, error: errorMessage, isTracking: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  const startRun = useCallback(() => {
    isRunningRef.current = true;
    isPausedRef.current = false;
    isSimulatingRef.current = false;
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    
    setState(s => ({ 
      ...s, 
      isRunning: true, 
      isPaused: false,
      startTime: Date.now(),
      elapsedTime: 0,
      trail: s.currentLocation ? [{...s.currentLocation, timestamp: Date.now()}] : [] 
    }));
  }, []);

  const pauseRun = useCallback(() => {
    isPausedRef.current = true;
    setState(s => ({ ...s, isPaused: true }));
  }, []);

  const resumeRun = useCallback(() => {
    isPausedRef.current = false;
    setState(s => ({ ...s, isPaused: false }));
  }, []);

  const simulateRun = useCallback(() => {
    setState(s => {
      // If the user's GPS is completely blocked or broken, give them a default start location
      const startLocation = s.currentLocation || { lat: 37.7749, lng: -122.4194 };
      
      isSimulatingRef.current = true;
      isRunningRef.current = true;
      isPausedRef.current = false;
      
      let currentLat = startLocation.lat;
      let currentLng = startLocation.lng;
      let step = 0;
      
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      
      simulationIntervalRef.current = setInterval(() => {
        if (!isRunningRef.current) {
          if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
          isSimulatingRef.current = false;
          return;
        }

        if (isPausedRef.current) {
          return; // Skip updating trail and location if paused
        }
        
        // Move in a rough circle/polygon (velocity vector rotates)
        const angle = (step * 5) * (Math.PI / 180);
        const speed = 0.00003; // ~3.3 meters per second (12 km/h)
        
        currentLat += Math.cos(angle) * speed;
        currentLng += Math.sin(angle) * speed;
        
        const newCoord = { lat: currentLat, lng: currentLng };
        const newTrailPoint = { ...newCoord, timestamp: Date.now() };
        
        setState(prev => ({
          ...prev,
          currentLocation: newCoord,
          trail: [...prev.trail, newTrailPoint],
          isRunning: true
        }));
        
        step++;
      }, 1000);
      
      return {
        ...s,
        currentLocation: startLocation,
        isRunning: true,
        isPaused: false,
        startTime: Date.now(),
        elapsedTime: 0,
        trail: [{ ...startLocation, timestamp: Date.now() }],
        error: null, // Clear any GPU/GPS errors since we're forcing simulation
      };
    });
  }, []);

  const endRun = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    isSimulatingRef.current = false;
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    
    setState(s => {
      let distance = 0;
      if (s.isTracking && !s.isPaused && s.trail.length > 1) {
        for (let i = 1; i < s.trail.length; i++) {
          const from = turf.point([s.trail[i - 1].lng, s.trail[i - 1].lat]);
          const to = turf.point([s.trail[i].lng, s.trail[i].lat]);
          distance += turf.distance(from, to, { units: 'kilometers' });
        }
      }
      return { ...s, isRunning: false, isPaused: false, totalDistanceCovered: distance };
    });
  }, []);

  const resetRun = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    isSimulatingRef.current = false;
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setState(s => ({ ...s, trail: [], isRunning: false, isPaused: false, startTime: null, elapsedTime: 0, totalDistanceCovered: 0 }));
  }, []);

  return { ...state, startRun, pauseRun, resumeRun, endRun, resetRun, simulateRun };
}
