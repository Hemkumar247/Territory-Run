/** Reject jitter and GPS jumps so distance and territory match the path the runner actually took. */
export const MAX_TRAIL_ACCURACY_M = 40;
export const MIN_STEP_M = 4;
/** Faster than a sprint. A larger jump is a bad fix, not movement. */
export const MAX_SPEED_MPS = 12;

export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

const EARTH_M = 6371000;

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return 0;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h = s1 * s1 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * s2 * s2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(Math.max(0, h))));
}

export function trailDistanceMeters(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceMeters(points[i - 1], points[i]);
  return total;
}

export function shouldAppendTrailPoint(
  previous: GeoPoint | undefined,
  next: GeoPoint & { accuracy: number }
): { accept: boolean; distanceMeters: number } {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return { accept: false, distanceMeters: 0 };
  if (!Number.isFinite(next.accuracy) || next.accuracy <= 0 || next.accuracy > MAX_TRAIL_ACCURACY_M) {
    return { accept: false, distanceMeters: 0 };
  }
  if (!previous) return { accept: true, distanceMeters: 0 };

  const moved = distanceMeters(previous, next);
  const dt = (next.timestamp - previous.timestamp) / 1000;
  if (moved < MIN_STEP_M) return { accept: false, distanceMeters: 0 };
  if (!(dt > 0) || moved / dt > MAX_SPEED_MPS) return { accept: false, distanceMeters: 0 };
  return { accept: true, distanceMeters: moved };
}

/**
 * Decide whether a new GPS reading should move the "you are here" puck.
 * The first reading can be coarse so the map leaves the placeholder immediately.
 * Later readings must not yank the camera onto a worse fix.
 */
export function shouldUpdateFix(
  current: { lat: number; lng: number; accuracy: number } | null,
  next: { lat: number; lng: number; accuracy: number }
): boolean {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return false;
  const accuracy = Number.isFinite(next.accuracy) && next.accuracy > 0 ? next.accuracy : 150;
  if (accuracy > 250) return false;
  if (!current) return true;
  if (accuracy <= current.accuracy + 5) return true;
  const moved = distanceMeters(current, next);
  // A clearly worse fix may not drag the puck unless the runner has actually moved past both error bars.
  return moved > current.accuracy + accuracy && accuracy <= 80;
}
