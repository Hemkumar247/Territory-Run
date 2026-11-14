import { registerPlugin } from '@capacitor/core';
import { Geolocation, Position, PositionOptions, GeolocationOptions } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

// Android foreground service (type=location). Keeps GPS flowing while the screen is off or the app is in the background.
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export interface GPSConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

type LocationCallback = (location: LocationUpdate) => void;
type ErrorCallback = (error: Error) => void;

class CapacitorGPS {
  private watchId: string | null = null;
  private bgWatcherId: string | null = null;
  private bgStarting = false;
  private bgStopRequested = false;
  private locationCallback: LocationCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private config: GPSConfig = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    distanceFilter: 5,
  };

  async requestPermissions(): Promise<boolean> {
    try {
      const perm = await Geolocation.requestPermissions();
      return perm.location === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrentPosition(options?: Partial<PositionOptions>): Promise<LocationUpdate> {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: this.config.enableHighAccuracy,
      timeout: this.config.timeout,
      maximumAge: this.config.maximumAge,
      ...options,
    });
    return this.mapPosition(pos);
  }

  async startWatching(
    callback: LocationCallback,
    errorCallback?: ErrorCallback,
    options?: Partial<GeolocationOptions>
  ): Promise<void> {
    this.locationCallback = callback;
    this.errorCallback = errorCallback;

    if (this.watchId) {
      await this.stopWatching();
    }

    try {
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
          ...options,
        },
        (position, err) => {
          if (err) {
            this.errorCallback?.(new Error(err.message));
            return;
          }
          if (position) {
            this.locationCallback?.(this.mapPosition(position));
          }
        }
      );
    } catch (error) {
      this.errorCallback?.(error as Error);
    }
  }

  async stopWatching(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId }).catch(() => undefined);
      this.watchId = null;
    }
    this.locationCallback = null;
    this.errorCallback = null;
  }

  /**
   * Starts the foreground service for an active run. MUST be called while the app is visible
   * (e.g. from the Start button): Android only allows starting a location foreground service from the foreground.
   * The service shows a persistent notification for as long as the run lasts.
   */
  async startBackgroundTracking(callback: LocationCallback, errorCallback?: ErrorCallback): Promise<void> {
    if (this.bgStarting || this.bgWatcherId) return;
    this.bgStarting = true;
    this.bgStopRequested = false;
    try {
      const id = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: 'Territory Run',
          backgroundMessage: 'Recording your run',
          requestPermissions: true,
          stale: false,
          distanceFilter: this.config.distanceFilter,
        },
        (location, error) => {
          if (error) {
            errorCallback?.(new Error(error.code === 'NOT_AUTHORIZED' ? 'Location permission denied. Please enable GPS in settings.' : error.message));
            return;
          }
          if (location) {
            callback({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              altitude: location.altitude,
              speed: location.speed,
              heading: location.bearing,
              timestamp: location.time ?? Date.now(),
            });
          }
        }
      );
      this.bgWatcherId = id;
    } catch (error) {
      errorCallback?.(error as Error);
    } finally {
      this.bgStarting = false;
    }
    // The run ended while the service was still starting.
    if (this.bgStopRequested) await this.stopBackgroundTracking();
  }

  async stopBackgroundTracking(): Promise<void> {
    this.bgStopRequested = true;
    if (!this.bgWatcherId) return;
    const id = this.bgWatcherId;
    this.bgWatcherId = null;
    await BackgroundGeolocation.removeWatcher({ id }).catch(() => undefined);
  }

  /** Opens the app's system settings (e.g. for the user to re-enable location or exempt it from battery limits). */
  openSettings(): Promise<void> {
    return BackgroundGeolocation.openSettings().catch(() => undefined);
  }

  setConfig(config: Partial<GPSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private mapPosition(position: Position): LocationUpdate {
    const coords = position.coords;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude ?? null,
      speed: coords.speed ?? null,
      heading: coords.heading ?? null,
      timestamp: position.timestamp,
    };
  }

  async isLocationEnabled(): Promise<boolean> {
    try {
      const perm = await Geolocation.checkPermissions();
      return perm.location === 'granted' || perm.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }

  addAppStateListener(callback: (state: 'active' | 'background') => void): () => void {
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      callback(isActive ? 'active' : 'background');
    });
    return () => listener.then(l => l.remove());
  }
}

export const capacitorGPS = new CapacitorGPS();