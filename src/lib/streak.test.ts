import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  getDayDifference,
  getStreakStatus,
  calculateNextStreak,
} from './streak';

describe('Daily Active Streak Logic', () => {
  it('formats local date strings as YYYY-MM-DD', () => {
    const date = new Date(2026, 10, 5, 14, 30); // Nov 5, 2026
    expect(getLocalDateString(date)).toBe('2026-11-05');
  });

  it('computes exact day differences across month and DST boundaries', () => {
    expect(getDayDifference('2026-10-31', '2026-11-01')).toBe(1);
    expect(getDayDifference('2026-11-01', '2026-11-01')).toBe(0);
    expect(getDayDifference('2026-11-01', '2026-11-03')).toBe(2);
    expect(getDayDifference('invalid', '2026-11-03')).toBeNull();
  });

  it('starts a streak at 1 on the very first run', () => {
    const now = new Date(2026, 10, 13, 9, 0);
    const result = calculateNextStreak({}, now);
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastRunDate: '2026-11-13',
    });
  });

  it('does not double-count multiple runs on the same day', () => {
    const now = new Date(2026, 10, 13, 18, 0);
    const result = calculateNextStreak(
      { currentStreak: 4, longestStreak: 6, lastRunDate: '2026-11-13' },
      now
    );
    expect(result).toEqual({
      currentStreak: 4,
      longestStreak: 6,
      lastRunDate: '2026-11-13',
    });
  });

  it('increments streak and updates longestStreak on consecutive day runs', () => {
    const now = new Date(2026, 10, 13, 7, 30);
    const result = calculateNextStreak(
      { currentStreak: 5, longestStreak: 5, lastRunDate: '2026-11-12' },
      now
    );
    expect(result).toEqual({
      currentStreak: 6,
      longestStreak: 6,
      lastRunDate: '2026-11-13',
    });
  });

  it('resets currentStreak to 1 after missing a day while preserving longestStreak', () => {
    const now = new Date(2026, 10, 13, 10, 0);
    const result = calculateNextStreak(
      { currentStreak: 8, longestStreak: 12, lastRunDate: '2026-11-11' },
      now
    );
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 12,
      lastRunDate: '2026-11-13',
    });
  });

  it('reports completed_today, at_risk, broken, and inactive streak statuses accurately', () => {
    const now = new Date(2026, 10, 13, 12, 0);

    expect(
      getStreakStatus({ currentStreak: 3, longestStreak: 5, lastRunDate: '2026-11-13' }, now)
    ).toMatchObject({ activeStreak: 3, longestStreak: 5, status: 'completed_today' });

    expect(
      getStreakStatus({ currentStreak: 3, longestStreak: 5, lastRunDate: '2026-11-12' }, now)
    ).toMatchObject({ activeStreak: 3, longestStreak: 5, status: 'at_risk' });

    expect(
      getStreakStatus({ currentStreak: 3, longestStreak: 5, lastRunDate: '2026-11-10' }, now)
    ).toMatchObject({ activeStreak: 0, longestStreak: 5, status: 'broken' });

    expect(getStreakStatus({}, now)).toMatchObject({
      activeStreak: 0,
      longestStreak: 0,
      status: 'inactive',
    });
  });
});
