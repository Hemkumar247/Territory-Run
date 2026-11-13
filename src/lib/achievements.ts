import { User } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // We'll map this to a Lucide icon in the UI
  check: (user: User, newStats: { distanceCovered: number, territoryGained: number, nextStreak?: number }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_run',
    title: 'First Blood',
    description: 'Complete your first run.',
    icon: 'Footprints',
    check: (user) => (user.totalRuns || 0) + 1 === 1
  },
  {
    id: 'marathoner',
    title: 'Marathoner',
    description: 'Run a total of 42.2 km.',
    icon: 'Medal',
    check: (user, newStats) => (user.totalDistance + newStats.distanceCovered) >= 42200
  },
  {
    id: 'empire_builder',
    title: 'Empire Builder',
    description: 'Claim your first territory.',
    icon: 'Flag',
    check: (user, newStats) => newStats.territoryGained > 0 && user.territoryStrength === 0
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a run before 7 AM.',
    icon: 'Sunrise',
    check: () => new Date().getHours() < 7
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a run after 9 PM.',
    icon: 'Moon',
    check: () => new Date().getHours() >= 21
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Run a total of 100 km.',
    icon: 'Trophy',
    check: (user, newStats) => (user.totalDistance + newStats.distanceCovered) >= 100000
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Run 3 consecutive days.',
    icon: 'Flame',
    check: (_user, newStats) => (newStats.nextStreak || 0) >= 3
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day active streak.',
    icon: 'Zap',
    check: (_user, newStats) => (newStats.nextStreak || 0) >= 7
  }
];

export function checkAchievements(user: User, newStats: { distanceCovered: number, territoryGained: number, nextStreak?: number }): string[] {
  const currentAchievements = user.achievements || [];
  const newAchievements: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!currentAchievements.includes(achievement.id)) {
      if (achievement.check(user, newStats)) {
        newAchievements.push(achievement.id);
      }
    }
  }

  return newAchievements;
}
