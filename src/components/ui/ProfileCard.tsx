import React from 'react';
import { Flame, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStreakStatus } from '../../lib/streak';
import { GlassCard } from './GlassCard';
import { NeonText } from './NeonText';
import { StatsDisplay } from './StatsDisplay';
import { AchievementBadge } from './AchievementBadge';

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  avatarUrl?: string;
  totalDistance: number;
  totalRuns: number;
  territoryControlled: number;
  avgStrength?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastRunDate?: string;
  achievements?: string[];
  color?: string;
}

export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  (
    {
      className,
      name,
      level,
      xp,
      nextLevelXp,
      avatarUrl,
      totalDistance,
      totalRuns,
      territoryControlled,
      avgStrength = 0,
      currentStreak = 0,
      longestStreak = 0,
      lastRunDate,
      achievements = [],
      color = '#7B2FFF',
      ...props
    },
    ref
  ) => {
    const progress = Math.min(100, Math.max(0, (xp / nextLevelXp) * 100));
    const streakInfo = getStreakStatus({ currentStreak, longestStreak, lastRunDate });
    const cycleDayCount = streakInfo.activeStreak > 0 ? ((streakInfo.activeStreak - 1) % 7) + 1 : 0;

    const statusConfig = {
      completed_today: {
        badge: 'Today Logged',
        message: "Today's run locked in — territory defense boosted.",
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        flameClass: 'text-amber-500 dark:text-[#FFB800] drop-shadow-[0_0_12px_rgba(255,184,0,0.7)]',
        iconBg: 'bg-amber-500/15 border-amber-500/30',
        barColor: 'bg-gradient-to-r from-amber-500 to-emerald-400',
        Icon: CheckCircle2,
      },
      at_risk: {
        badge: 'Run Today',
        message: 'Log a run today to keep your streak alive & defend your turf.',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-[#FFB800] border-amber-500/30',
        flameClass: 'text-amber-500 dark:text-[#FFB800] animate-pulse drop-shadow-[0_0_10px_rgba(255,184,0,0.5)]',
        iconBg: 'bg-amber-500/10 border-amber-500/25',
        barColor: 'bg-amber-500',
        Icon: AlertCircle,
      },
      broken: {
        badge: 'Streak Reset',
        message: 'Missed a day — complete a run today to ignite a new streak.',
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
        flameClass: 'text-slate-400 dark:text-slate-500',
        iconBg: 'bg-slate-500/10 border-slate-500/20',
        barColor: 'bg-slate-400',
        Icon: Flame,
      },
      inactive: {
        badge: 'Start Streak',
        message: 'Complete your first run today to start a daily streak.',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
        flameClass: 'text-slate-400 dark:text-slate-500',
        iconBg: 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10',
        barColor: 'bg-teal-500',
        Icon: Flame,
      },
    }[streakInfo.status];

    const StatusIcon = statusConfig.Icon;

    return (
      <GlassCard
        ref={ref}
        variant="elevated"
        className={cn('p-6 flex flex-col gap-6 rounded-[32px]', className)}
        {...props}
      >
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full p-1 shrink-0" style={{ background: `linear-gradient(135deg, ${color}40, transparent)` }}>
            <div className="w-full h-full rounded-full overflow-hidden border-2" style={{ borderColor: color }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <span className="text-slate-500 dark:text-white/50 text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white truncate pr-2">{name}</h2>
              <div className="bg-white/90 dark:bg-black/80 border border-black/10 dark:border-white/20 rounded-full px-3 py-0.5 backdrop-blur-md shrink-0">
                <NeonText color={color} intensity="low" className="text-xs font-bold">Lvl {level}</NeonText>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-white/60 mb-3 truncate">Urban Runner</p>
            
            <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">{xp} XP</span>
              <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">{nextLevelXp} XP</span>
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-slate-300 dark:bg-white/10" />

        <div className="grid grid-cols-4 gap-2">
          <StatsDisplay label="Distance" value={totalDistance} unit="km" colorClass="text-[#008B99] dark:text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,139,153,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
          <StatsDisplay label="Runs" value={totalRuns} colorClass="text-[#B38000] dark:text-[#FFB800] drop-shadow-[0_0_8px_rgba(179,128,0,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          <StatsDisplay label="Area" value={territoryControlled} unit="km²" colorClass="text-[#B32A78] dark:text-[#FF3CAC] drop-shadow-[0_0_8px_rgba(179,42,120,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,60,172,0.8)]" />
          <StatsDisplay label="Power" value={avgStrength} unit="%" colorClass="text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>

        <div className="h-[1px] w-full bg-slate-300 dark:bg-white/10" />

        {/* Daily Active Streak Counter */}
        <section
          aria-label="Daily Active Streak"
          className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0', statusConfig.iconBg)}>
                <Flame aria-hidden="true" className={cn('w-6 h-6', statusConfig.flameClass)} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-semibold">
                  Daily Active Streak
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold tabular-nums text-slate-900 dark:text-white">
                    {streakInfo.activeStreak}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {streakInfo.activeStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusConfig.badgeClass)}>
                <StatusIcon aria-hidden="true" className="w-3 h-3" />
                {statusConfig.badge}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <Trophy aria-hidden="true" className="w-3 h-3 text-amber-500" />
                Best: {streakInfo.longestStreak}d
              </span>
            </div>
          </div>

          {/* 7-Day Milestone Momentum Track */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-7 gap-1.5" aria-label={`7-day streak progress: ${cycleDayCount} of 7 days`}>
              {Array.from({ length: 7 }, (_, idx) => {
                const filled = idx < cycleDayCount;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      filled ? statusConfig.barColor : 'bg-black/10 dark:bg-white/10'
                    )}
                  />
                );
              })}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {statusConfig.message}
            </p>
          </div>
        </section>

        {achievements.length > 0 && (
          <>
            <div className="h-[1px] w-full bg-slate-300 dark:bg-white/10" />
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-semibold mb-3">Achievements</p>
              <div className="flex flex-wrap gap-2">
                {achievements.map(achId => (
                  <AchievementBadge key={achId} id={achId} size="sm" />
                ))}
              </div>
            </div>
          </>
        )}
      </GlassCard>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';
