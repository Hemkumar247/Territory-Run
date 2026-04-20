import { describe, it, expect } from 'vitest';
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
});
