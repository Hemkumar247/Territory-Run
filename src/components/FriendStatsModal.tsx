import React, { useMemo } from 'react';
import { Activity, Clock3, Shield, Trophy, X } from 'lucide-react';
import { calculateDecayedStrength } from '../lib/utils';
import { getUserRank } from '../lib/ranks';
import { Territory, User } from '../types';
import { AchievementBadge } from './ui/AchievementBadge';
import { StatsDisplay } from './ui/StatsDisplay';

const toDate = (value: User['lastActive']): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatLastActiveLabel = (
  lastActive: User['lastActive'],
  nowTimestamp: number = Date.now()
): string => {
  const activeAt = toDate(lastActive);
  if (!activeAt) {
    return 'No activity yet';
  }

  const diffMs = Math.max(0, nowTimestamp - activeAt.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Active now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return activeAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export interface FriendStatsModalProps {
  friend: User | null;
  territory: Territory | null;
  loading: boolean;
  onClose: () => void;
}

export function FriendStatsModal({
  friend,
  territory,
  loading,
  onClose,
}: FriendStatsModalProps) {
  const friendSummary = useMemo(() => {
    if (!friend) return null;

    const rank = getUserRank(friend.totalDistance || 0);
    const totalDistanceKm = ((friend.totalDistance || 0) / 1000).toFixed(2);
    const territoryControlled = (territory?.areaKm2 || 0).toFixed(2);
    const livePower = territory ? calculateDecayedStrength(territory.strength || 0, territory.lastUpdated) : 0;
    const totalRuns = friend.totalRuns || 0;
    const wins = friend.wins || 0;
    const losses = friend.losses || 0;
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

    return {
      rank,
      totalDistanceKm,
      territoryControlled,
      livePower,
      totalRuns,
      wins,
      losses,
      winRate,
      lastActiveLabel: formatLastActiveLabel(friend.lastActive),
    };
  }, [friend, territory]);

  return (
    <div
      className="fixed inset-0 z-[3200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="friend-stats-heading"
        className="glass-panel relative flex max-h-[82vh] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-black/40 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full blur-[90px] mix-blend-screen opacity-70"
          style={{ backgroundColor: friend?.territoryColor || '#10b981' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/12 to-transparent dark:from-white/[0.04]" />

        <button
          onClick={onClose}
          aria-label="Close friend stats"
          className="absolute top-4 right-4 z-20 rounded-full border border-black/10 bg-white/80 p-2 text-slate-600 shadow-lg backdrop-blur-md transition-colors hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:bg-black/60 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-5">
          <div className="pr-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Friend Intel
            </p>
            <h3 id="friend-stats-heading" className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Live Stats
            </h3>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {loading && !friend ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Syncing friend stats...</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Waiting for Firestore updates.</p>
              </div>
            ) : !friend || !friendSummary ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">That runner is unavailable right now.</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try reopening their profile in a moment.</p>
              </div>
            ) : (
              <>
                <div
                  className="relative overflow-hidden rounded-[1.5rem] border border-black/5 bg-black/[0.04] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]"
                  style={{
                    boxShadow: `inset 0 1px 0 ${friend.territoryColor}20`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-100"
                    style={{ background: `radial-gradient(circle at top right, ${friend.territoryColor}33, transparent 50%)` }}
                  />
                  <div className="relative flex items-start gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-inner"
                      style={{ backgroundColor: friend.territoryColor }}
                    >
                      {friend.displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 pr-2">
                        <h4 className="truncate font-display text-xl font-bold text-slate-900 dark:text-white">
                          {friend.displayName}
                        </h4>
                        <span className="rounded-full border border-black/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                          {friendSummary.rank.title}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Real-time performance snapshot for healthy competition.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-black/10 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-white/10 dark:text-slate-200">
                          <Activity className="h-3.5 w-3.5 text-teal-500" />
                          Live sync on
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-black/10 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-white/10 dark:text-slate-200">
                          <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                          {friendSummary.lastActiveLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-black/10 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-white/10 dark:text-slate-200">
                          <Shield className="h-3.5 w-3.5 text-emerald-500" />
                          {territory ? 'Territory active' : 'No territory yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <StatsDisplay label="Distance" value={friendSummary.totalDistanceKm} unit="km" glow={false} colorClass="text-[#008B99] dark:text-[#00E5FF]" />
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <StatsDisplay label="Runs" value={friendSummary.totalRuns} glow={false} colorClass="text-[#B38000] dark:text-[#FFB800]" />
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <StatsDisplay label="Area" value={friendSummary.territoryControlled} unit="km2" glow={false} colorClass="text-[#B32A78] dark:text-[#FF3CAC]" />
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <StatsDisplay label="Power" value={friendSummary.livePower} unit="%" glow={false} colorClass="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <StatsDisplay label="Wins" value={friendSummary.wins} glow={false} colorClass="text-slate-900 dark:text-white" />
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <StatsDisplay label="Losses" value={friendSummary.losses} glow={false} colorClass="text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Win Rate</span>
                    </div>
                    <p className="mt-3 font-mono text-3xl font-bold text-slate-900 dark:text-white">
                      {friendSummary.winRate}
                      <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">%</span>
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Territory Status
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                      {territory ? `${friendSummary.territoryControlled} km2 under control` : 'Waiting for first claim'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Updates instantly when this runner finishes a session.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/5 dark:bg-white/[0.04]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Achievements
                  </p>
                  {friend.achievements && friend.achievements.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {friend.achievements.map((achievementId) => (
                        <AchievementBadge key={achievementId} id={achievementId} size="sm" />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      No badges unlocked yet. Time to put some pressure on the leaderboard.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
