import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FriendStatsModal, formatLastActiveLabel } from './FriendStatsModal';
import { Territory, User } from '../types';

afterEach(() => {
  vi.useRealTimers();
});

describe('formatLastActiveLabel', () => {
  it('formats recent activity in minutes', () => {
    const now = new Date('2026-05-25T12:00:00.000Z').getTime();
    const lastActive = new Date('2026-05-25T11:42:00.000Z');

    expect(formatLastActiveLabel(lastActive, now)).toBe('18m ago');
  });

  it('formats very recent activity as active now', () => {
    const now = new Date('2026-05-25T12:00:00.000Z').getTime();
    const lastActive = new Date('2026-05-25T11:59:45.000Z');

    expect(formatLastActiveLabel(lastActive, now)).toBe('Active now');
  });
});

describe('FriendStatsModal', () => {
  it('renders a friend performance snapshot with live stats', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T12:00:00.000Z'));

    const friend: User = {
      uid: 'friend-1',
      displayName: 'NeonGhost',
      territoryColor: '#00E5FF',
      totalDistance: 42200,
      territoryStrength: 100,
      lastActive: new Date('2026-05-25T11:42:00.000Z'),
      wins: 9,
      losses: 3,
      totalRuns: 12,
      achievements: ['first_run', 'marathoner'],
    };

    const territory: Territory = {
      uid: 'friend-1',
      coordinates: [],
      strength: 84,
      lastUpdated: new Date('2026-05-25T12:00:00.000Z'),
      areaKm2: 1.25,
    };

    render(
      <FriendStatsModal
        friend={friend}
        territory={territory}
        loading={false}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('NeonGhost')).toBeInTheDocument();
    expect(screen.getByText('Pathfinder')).toBeInTheDocument();
    expect(screen.getByText('42.20')).toBeInTheDocument();
    expect(screen.getByText('1.25')).toBeInTheDocument();
    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('First Blood')).toBeInTheDocument();
    expect(screen.getByText('Marathoner')).toBeInTheDocument();
    expect(screen.getByText(/Live sync on/i)).toBeInTheDocument();
  });
});
