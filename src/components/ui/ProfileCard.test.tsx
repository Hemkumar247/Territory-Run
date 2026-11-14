import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProfileCard } from './ProfileCard';
import { getLocalDateString } from '../../lib/streak';

describe('ProfileCard Daily Active Streak', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays active streak and Today Logged badge when run was completed today', () => {
    const today = getLocalDateString(new Date());
    render(
      <ProfileCard
        name="Alex"
        level={3}
        xp={450}
        nextLevelXp={1000}
        totalDistance={24.5}
        totalRuns={6}
        territoryControlled={1.2}
        avgStrength={88}
        currentStreak={5}
        longestStreak={9}
        lastRunDate={today}
      />
    );

    expect(screen.getByLabelText('Daily Active Streak')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Today Logged')).toBeInTheDocument();
    expect(screen.getByText('Best: 9d')).toBeInTheDocument();
  });

  it('displays Run Today warning when last run was yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 13, 10, 0));

    render(
      <ProfileCard
        name="Alex"
        level={3}
        xp={450}
        nextLevelXp={1000}
        totalDistance={24.5}
        totalRuns={6}
        territoryControlled={1.2}
        currentStreak={4}
        longestStreak={4}
        lastRunDate="2026-11-12"
      />
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Run Today')).toBeInTheDocument();
    expect(screen.getByText('Best: 4d')).toBeInTheDocument();
  });

  it('resets displayed active streak to 0 while keeping personal best when missed a day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 13, 10, 0));

    render(
      <ProfileCard
        name="Alex"
        level={3}
        xp={450}
        nextLevelXp={1000}
        totalDistance={24.5}
        totalRuns={6}
        territoryControlled={1.2}
        currentStreak={4}
        longestStreak={11}
        lastRunDate="2026-11-10"
      />
    );

    expect(screen.getByText('Streak Reset')).toBeInTheDocument();
    expect(screen.getByText('Best: 11d')).toBeInTheDocument();
  });
});
