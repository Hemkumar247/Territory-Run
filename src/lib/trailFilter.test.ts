import { describe, expect, it } from 'vitest';
import { shouldAppendTrailPoint, shouldUpdateFix, trailDistanceMeters } from './trailFilter';

const base = { lat: 12.9716, lng: 77.5946, timestamp: 1_000_000 };

describe('trail filter', () => {
  it('accepts the first accurate point and ignores a stationary jitter', () => {
    const first = shouldAppendTrailPoint(undefined, { ...base, accuracy: 8 });
    expect(first.accept).toBe(true);

    const jitter = shouldAppendTrailPoint(base, {
      lat: base.lat + 0.00001,
      lng: base.lng,
      timestamp: base.timestamp + 2000,
      accuracy: 8,
    });
    expect(jitter.accept).toBe(false);
  });

  it('rejects a poor fix and a teleport that is faster than a sprint', () => {
    expect(shouldAppendTrailPoint(base, { ...base, lat: base.lat + 0.001, timestamp: base.timestamp + 5000, accuracy: 90 }).accept).toBe(false);

    const teleport = shouldAppendTrailPoint(base, {
      lat: base.lat + 0.05,
      lng: base.lng,
      timestamp: base.timestamp + 2000,
      accuracy: 10,
    });
    expect(teleport.accept).toBe(false);
  });

  it('counts only the accepted step toward distance', () => {
    const step = shouldAppendTrailPoint(base, {
      lat: base.lat + 0.0002,
      lng: base.lng,
      timestamp: base.timestamp + 8000,
      accuracy: 6,
    });
    expect(step.accept).toBe(true);
    expect(step.distanceMeters).toBeGreaterThan(15);
    expect(step.distanceMeters).toBeLessThan(40);

    const total = trailDistanceMeters([base, { lat: base.lat + 0.0002, lng: base.lng }]);
    expect(Math.abs(total - step.distanceMeters)).toBeLessThan(0.5);
  });

  it('shows the first fix immediately and refuses to replace a good fix with a worse one', () => {
    expect(shouldUpdateFix(null, { ...base, accuracy: 120 })).toBe(true);
    expect(shouldUpdateFix({ ...base, accuracy: 8 }, { lat: base.lat + 0.00002, lng: base.lng, accuracy: 80 })).toBe(false);
    expect(shouldUpdateFix({ ...base, accuracy: 30 }, { lat: base.lat + 0.0003, lng: base.lng, accuracy: 12 })).toBe(true);
  });
});
