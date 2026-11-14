import { describe, expect, it } from 'vitest';
import { locationGranted, toLocationAccess } from './locationAccess';

describe('location access', () => {
  it('treats fine and coarse grants as usable', () => {
    expect(toLocationAccess({ location: 'granted', coarseLocation: 'granted' })).toBe('precise');
    expect(toLocationAccess({ location: 'denied', coarseLocation: 'granted' })).toBe('approximate');
    expect(locationGranted('precise')).toBe(true);
    expect(locationGranted('approximate')).toBe(true);
  });

  it('tells a switched-off GPS apart from a denied permission', () => {
    expect(toLocationAccess(undefined, new Error('Location services are not enabled.'))).toBe('disabled');
    expect(toLocationAccess({ location: 'denied', coarseLocation: 'denied' })).toBe('denied');
    expect(toLocationAccess({ location: 'prompt', coarseLocation: 'prompt' })).toBe('prompt');
  });
});
