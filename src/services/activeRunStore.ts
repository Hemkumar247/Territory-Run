import { trailDistanceMeters } from '../lib/trailFilter';

const RUN_KEY = 'tr_active_run_v1';
const FIX_KEY = 'tr_last_fix_v1';
const MAX_RUN_AGE_MS = 6 * 60 * 60 * 1000;

export interface StoredTrailPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface StoredRun {
  active: boolean;
  paused: boolean;
  startedAt: number;
  pausedMs: number;
  savedAt: number;
  trail: StoredTrailPoint[];
}

export interface StoredFix {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadActiveRun(): StoredRun | null {
  const run = readJson<StoredRun>(RUN_KEY);
  if (!run?.active || !Array.isArray(run.trail)) return null;
  if (!Number.isFinite(run.savedAt) || Date.now() - run.savedAt > MAX_RUN_AGE_MS) {
    localStorage.removeItem(RUN_KEY);
    return null;
  }
  return run;
}

export function saveActiveRun(run: Omit<StoredRun, 'savedAt'>): void {
  try {
    const payload: StoredRun = { ...run, savedAt: Date.now(), trail: run.trail.slice(-5000) };
    localStorage.setItem(RUN_KEY, JSON.stringify(payload));
  } catch {
    // A full disk must not stop the live trail in memory.
  }
}

export function clearActiveRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // ignore
  }
}

export function storedRunDistanceMeters(run: StoredRun): number {
  return trailDistanceMeters(run.trail);
}

export function loadLastFix(): StoredFix | null {
  const fix = readJson<StoredFix>(FIX_KEY);
  if (!fix || !Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)) return null;
  if (Date.now() - fix.timestamp > 7 * 24 * 60 * 60 * 1000) return null;
  return fix;
}

export function saveLastFix(fix: StoredFix): void {
  try {
    localStorage.setItem(FIX_KEY, JSON.stringify(fix));
  } catch {
    // ignore
  }
}
