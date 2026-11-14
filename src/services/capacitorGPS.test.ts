import { describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  addWatcher: vi.fn(),
  removeWatcher: vi.fn(() => Promise.resolve()),
  openSettings: vi.fn(),
}));

vi.mock('@capacitor/core', async (orig) => ({
  ...(await orig<typeof import('@capacitor/core')>()),
  registerPlugin: () => fake,
}));

import { capacitorGPS } from './capacitorGPS';

describe('background tracking (foreground service)', () => {
  it('maps plugin fixes and removes the watcher on stop', async () => {
    fake.addWatcher.mockImplementation(async (_o, cb) => {
      cb({ latitude: 1, longitude: 2, accuracy: 5, altitude: null, speed: 3, bearing: 90, time: 111 });
      return 'w1';
    });
    const cb = vi.fn();
    await capacitorGPS.startBackgroundTracking(cb);
    expect(cb).toHaveBeenCalledWith({ latitude: 1, longitude: 2, accuracy: 5, altitude: null, speed: 3, heading: 90, timestamp: 111 });
    await capacitorGPS.stopBackgroundTracking();
    expect(fake.removeWatcher).toHaveBeenCalledWith({ id: 'w1' });
  });

  it('does not leak the service if the run is stopped while it is still starting', async () => {
    fake.removeWatcher.mockClear();
    let resolve!: (id: string) => void;
    fake.addWatcher.mockImplementation(() => new Promise<string>((r) => (resolve = r)));
    const starting = capacitorGPS.startBackgroundTracking(vi.fn());
    await capacitorGPS.stopBackgroundTracking(); // user taps Stop before addWatcher resolves
    resolve('w2');
    await starting;
    expect(fake.removeWatcher).toHaveBeenCalledWith({ id: 'w2' });
  });
});
