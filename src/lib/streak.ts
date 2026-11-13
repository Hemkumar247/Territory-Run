import { User } from '../types';

export type StreakStatus = 'completed_today' | 'at_risk' | 'broken' | 'inactive';

export interface StreakSummary {
  activeStreak: number;
  longestStreak: number;
  status: StreakStatus;
  daysSinceLastRun: number | null;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formats a Date into local YYYY-MM-DD calendar format.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes exact whole-day difference between two YYYY-MM-DD strings using UTC midnight
 * so Daylight Saving Time changes never skew streak calculations.
 */
export function getDayDifference(fromDateStr: string, toDateStr: string): number | null {
  const fromMatch = DATE_PATTERN.exec(fromDateStr);
  const toMatch = DATE_PATTERN.exec(toDateStr);
  if (!fromMatch || !toMatch) return null;

  const fromUtc = Date.UTC(Number(fromMatch[1]), Number(fromMatch[2]) - 1, Number(fromMatch[3]));
  const toUtc = Date.UTC(Number(toMatch[1]), Number(toMatch[2]) - 1, Number(toMatch[3]));
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates the user's current streak status relative to `now` for display on their profile.
 */
export function getStreakStatus(
  user: Pick<User, 'currentStreak' | 'longestStreak' | 'lastRunDate'>,
  now: Date = new Date()
): StreakSummary {
  const storedCurrent = Math.max(0, user.currentStreak || 0);
  const storedLongest = Math.max(storedCurrent, user.longestStreak || 0);

  if (!user.lastRunDate) {
    return {
      activeStreak: 0,
      longestStreak: storedLongest,
      status: 'inactive',
      daysSinceLastRun: null,
    };
  }

  const today = getLocalDateString(now);
  const diff = getDayDifference(user.lastRunDate, today);

  if (diff === null) {
    return {
      activeStreak: 0,
      longestStreak: storedLongest,
      status: 'inactive',
      daysSinceLastRun: null,
    };
  }

  if (diff <= 0) {
    const active = Math.max(1, storedCurrent);
    return {
      activeStreak: active,
      longestStreak: Math.max(storedLongest, active),
      status: 'completed_today',
      daysSinceLastRun: 0,
    };
  }

  if (diff === 1 && storedCurrent > 0) {
    return {
      activeStreak: storedCurrent,
      longestStreak: storedLongest,
      status: 'at_risk',
      daysSinceLastRun: 1,
    };
  }

  return {
    activeStreak: 0,
    longestStreak: storedLongest,
    status: storedLongest > 0 ? 'broken' : 'inactive',
    daysSinceLastRun: diff,
  };
}

/**
 * Computes the next streak fields to persist when a run session is completed on `runDate`.
 */
export function calculateNextStreak(
  user: Pick<User, 'currentStreak' | 'longestStreak' | 'lastRunDate'>,
  runDate: Date = new Date()
): { currentStreak: number; longestStreak: number; lastRunDate: string } {
  const today = getLocalDateString(runDate);
  const storedCurrent = Math.max(0, user.currentStreak || 0);
  const storedLongest = Math.max(storedCurrent, user.longestStreak || 0);

  if (!user.lastRunDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(storedLongest, 1),
      lastRunDate: today,
    };
  }

  const diff = getDayDifference(user.lastRunDate, today);

  if (diff === null || diff > 1) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(storedLongest, 1),
      lastRunDate: today,
    };
  }

  if (diff <= 0) {
    const nextCurrent = Math.max(1, storedCurrent);
    return {
      currentStreak: nextCurrent,
      longestStreak: Math.max(storedLongest, nextCurrent),
      lastRunDate: today,
    };
  }

  // diff === 1 (ran yesterday, extending streak today)
  const nextCurrent = storedCurrent + 1;
  return {
    currentStreak: nextCurrent,
    longestStreak: Math.max(storedLongest, nextCurrent),
    lastRunDate: today,
  };
}
