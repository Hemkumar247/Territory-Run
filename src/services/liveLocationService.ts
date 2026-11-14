import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { distanceMeters } from '../lib/trailFilter';

export interface LiveRunPoint {
  uid: string;
  lat: number;
  lng: number;
  accuracy: number;
  displayName: string;
  territoryColor: string;
  updatedAtMs: number;
}

export interface PublishLiveLocationInput {
  uid: string;
  lat: number;
  lng: number;
  accuracy: number;
  displayName: string;
  territoryColor: string;
}

const lastWrite = new Map<string, { at: number; lat: number; lng: number }>();

/** Friends only need a fresh point every few seconds, not every GPS tick. */
export async function publishLiveLocation(input: PublishLiveLocationInput): Promise<void> {
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) return;
  if (!Number.isFinite(input.accuracy) || input.accuracy <= 0 || input.accuracy > 50) return;

  const now = Date.now();
  const prev = lastWrite.get(input.uid);
  if (prev) {
    const moved = distanceMeters(prev, input);
    if (now - prev.at < 5000) return;
    if (moved < 8 && now - prev.at < 15000) return;
  }
  lastWrite.set(input.uid, { at: now, lat: input.lat, lng: input.lng });

  const color = /^#[0-9A-Fa-f]{6}$/.test(input.territoryColor) ? input.territoryColor : '#3B82F6';
  await setDoc(doc(db, 'liveLocations', input.uid), {
    uid: input.uid,
    lat: input.lat,
    lng: input.lng,
    accuracy: input.accuracy,
    displayName: (input.displayName || 'Runner').slice(0, 50),
    territoryColor: color,
    active: true,
    updatedAt: serverTimestamp(),
  });
}

export async function clearLiveLocation(uid: string): Promise<void> {
  lastWrite.delete(uid);
  await deleteDoc(doc(db, 'liveLocations', uid)).catch(() => undefined);
}

function millisOf(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}

/** Hide a friend who stopped sending points (screen killed, run finished, or the delete did not land). */
const STALE_MS = 90_000;

export function subscribeFriendLiveLocations(friendIds: string[], onChange: (points: LiveRunPoint[]) => void): Unsubscribe {
  const unique = Array.from(new Set(friendIds.filter(Boolean)));
  if (unique.length === 0) {
    onChange([]);
    return () => undefined;
  }

  const points = new Map<string, LiveRunPoint>();
  const emit = () => {
    const fresh = Array.from(points.values()).filter((point) => Date.now() - point.updatedAtMs <= STALE_MS);
    onChange(fresh);
  };

  const unsubs = unique.map((uid) => onSnapshot(doc(db, 'liveLocations', uid), (snap) => {
    if (!snap.exists()) {
      points.delete(uid);
      emit();
      return;
    }
    const data = snap.data();
    const updatedAtMs = millisOf(data.updatedAt);
    if (data.active !== true || !Number.isFinite(data.lat) || !Number.isFinite(data.lng) || updatedAtMs <= 0) {
      points.delete(uid);
      emit();
      return;
    }
    points.set(uid, {
      uid,
      lat: data.lat,
      lng: data.lng,
      accuracy: typeof data.accuracy === 'number' ? data.accuracy : 50,
      displayName: typeof data.displayName === 'string' ? data.displayName : 'Friend',
      territoryColor: typeof data.territoryColor === 'string' ? data.territoryColor : '#3B82F6',
      updatedAtMs,
    });
    emit();
  }, () => {
    points.delete(uid);
    emit();
  }));

  return () => unsubs.forEach((unsub) => unsub());
}
