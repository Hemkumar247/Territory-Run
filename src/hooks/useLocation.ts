import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Coordinate } from '../types';
import * as turf from '@turf/turf';
import { capacitorGPS, GPSConfig, LocationUpdate } from '../services/capacitorGPS';

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

const isNative = Capacitor.isNativePlatform();

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
  const backgroundListenerRef = useRef<(() => void) | null>(null);

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
    const setupGPS = async () => {
      if (isNative) {
        const hasPerm = await capacitorGPS.requestPermissions();
        if (!hasPerm) {
          setState(s => ({ ...s, error: 'Location permission denied. Please enable GPS in settings.', isTracking: false }));
          return;
        }
      } else if (!navigator.geolocation) {
        setState(s => ({ ...s, error: 'Geolocation is not supported by your browser', isTracking: false }));
        return;
      }

      setState(s => ({ ...s, isTracking: true, error: null }));

      const processLocationUpdate = (location: LocationUpdate) => {
        const newCoord = { lat: location.latitude, lng: location.longitude };
        
        setState((prev) => {
          if (!isRunningRef.current || isPausedRef.current) {
            return {
              ...prev,
              currentLocation: newCoord,
              isTracking: true,
              error: null,
            };
          }

          const lastPoint = prev.trail[prev.trail.length - 1];
          if (lastPoint) {
            const from = turf.point([lastPoint.lng, lastPoint.lat]);
            const to = turf.point([location.longitude, location.latitude]);
            const distance = turf.distance(from, to, { units: 'kilometers' });
            
            if (distance < 0.003 || location.accuracy > 50) {
              return { ...prev, currentLocation: newCoord, isTracking: true, error: null };
            }
          }
          
          const newTrailPoint = { ...newCoord, timestamp: location.timestamp };
          return {
            ...prev,
            currentLocation: newCoord,
            trail: [...prev.trail, newTrailPoint],
            isTracking: true,
            error: null,
          };
        });
      };

      const handleError = (error: Error) => {
        if (isSimulatingRef.current) return;
        
        const errorMessage = error.message || 'An unknown error occurred';
        setState(s => ({ ...s, error: errorMessage, isTracking: false }));
      };

      if (isNative) {
        capacitorGPS.setConfig({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          distanceFilter: 5,
        });

        await capacitorGPS.startWatching(processLocationUpdate, handleError);
        
        backgroundListenerRef.current = capacitorGPS.addAppStateListener((state) => {
          if (state === 'background' && isRunningRef.current && !isPausedRef.current) {
            capacitorGPS.startBackgroundTracking();
          } else if (state === 'active') {
            capacitorGPS.stopBackgroundTracking();
          }
        });

        const locationEnabled = await capacitorGPS.isLocationEnabled();
        if (!locationEnabled) {
          setState(s => ({ ...s, error: 'Please enable location services', isTracking: false }));
        }
      } else {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (isSimulatingRef.current) return;
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
                errorMessage = 'Location permission denied. Please enable GPS.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage = 'The request to get user location timed out.';
                break;
            }
            setState(s => ({ ...s, error: errorMessage, isTracking: false }));
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );

        let indoorPoller: NodeJS.Timeout | null = null;
        indoorPoller = setInterval(() => {
          if (!isSimulatingRef.current && isRunningRef.current && !isPausedRef.current) {
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
              () => {},
              { enableHighAccuracy: true, maximumAge: 0, timeout: 3000 }
            );
          }
        }, 2000);

        return () => {
          navigator.geolocation.clearWatch(watchId);
          if (indoorPoller) clearInterval(indoorPoller);
        };
      }
    };

    setupGPS();

    return () => {
      if (isNative) {
        capacitorGPS.stopWatching().catch(() => undefined);
        capacitorGPS.stopBackgroundTracking().catch(() => undefined);
        if (backgroundListenerRef.current) {
          backgroundListenerRef.current();
        }
      }
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
      const baseLocation = s.currentLocation || { lat: 37.7749, lng: -122.4194 };
      const startLocation = {
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.005,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.005,
      };
      
      isSimulatingRef.current = true;
      isRunningRef.current = true;
      isPausedRef.current = false;
      
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

        if (isPausedRef.current) {
          return;
        }
        
        const angle = (step * turnRate) * (Math.PI / 180) + randomBaseAngle;
        
        currentLat += Math.cos(angle) * speed + (Math.random() - 0.5) * 0.000005;
        currentLng += Math.sin(angle) * speed + (Math.random() - 0.5) * 0.000005;
        
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
        error: null,
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