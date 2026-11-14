import { Geolocation, Position, PositionOptions, GeolocationOptions } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';

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
  private backgroundEnabled = false;
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

  async enableBackgroundMode(): Promise<boolean> {
    if (this.backgroundEnabled) return true;

    try {
      const info = await Device.getInfo();
      const isMobile = info.platform === 'ios' || info.platform === 'android';
      if (!isMobile) return false;

      this.backgroundEnabled = true;
      return true;
    } catch {
      return false;
    }
  }

  async startBackgroundTracking(): Promise<void> {
    if (!this.backgroundEnabled) {
      await this.enableBackgroundMode();
    }
  }

  async stopBackgroundTracking(): Promise<void> {
  }

  isBackgroundEnabled(): boolean {
    return this.backgroundEnabled;
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