import { describe, it, expect, vi } from 'vitest';
import { checkAchievements } from './achievements';
import { User } from '../types';

describe('Achievements Logic', () => {
  const dummyUserBase = {
    uid: 'test_uid',
    displayName: 'Test User',
    territoryColor: '#FF0000',
    totalDistance: 0,
    territoryStrength: 0,
    lastActive: new Date(),
    wins: 0,
    losses: 0,
    totalRuns: 0,
    achievements: []
  };

  it('unlocks First Blood on the very first run', () => {
    const user = { ...dummyUserBase, totalRuns: 0 } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 1000, territoryGained: 0 });
    
    expect(newAchievements).toContain('first_run');
  });

  it('does not repeatedly unlock First Blood', () => {
    const user = { ...dummyUserBase, totalRuns: 1, achievements: ['first_run'] } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 1000, territoryGained: 0 });
    
    expect(newAchievements).not.toContain('first_run');
  });

  it('processes properly if user achievements array is completely missing conceptually', () => {
    const user = { ...dummyUserBase, totalRuns: 0 } as any;
    delete user.achievements;
    const newAchievements = checkAchievements(user, { distanceCovered: 1000, territoryGained: 0 });
    expect(newAchievements).toContain('first_run');
  });

  it('unlocks Empire Builder on gaining territory from zero', () => {
    const user = { ...dummyUserBase, territoryStrength: 0 } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 500, territoryGained: 20 });
    
    expect(newAchievements).toContain('empire_builder');
  });

  it('unlocks Marathoner on passing 42.2km total', () => {
    const user = { ...dummyUserBase, totalDistance: 40000 } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 3000, territoryGained: 0 });
    
    expect(newAchievements).toContain('marathoner');
  });

  it('unlocks Century Club on passing 100km total', () => {
    const user = { ...dummyUserBase, totalDistance: 98000 } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 3000, territoryGained: 0 });
    
    expect(newAchievements).toContain('century_club');
  });

  it('unlocks Early Bird when running before 7 AM', () => {
    vi.setSystemTime(new Date(2023, 1, 1, 6, 30));
    const user = { ...dummyUserBase } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 1000, territoryGained: 0 });
    expect(newAchievements).toContain('early_bird');
    vi.useRealTimers();
  });

  it('unlocks Night Owl when running after 9 PM', () => {
    vi.setSystemTime(new Date(2023, 1, 1, 22, 30));
    const user = { ...dummyUserBase } as User;
    const newAchievements = checkAchievements(user, { distanceCovered: 1000, territoryGained: 0 });
    expect(newAchievements).toContain('night_owl');
    vi.useRealTimers();
  });
});
