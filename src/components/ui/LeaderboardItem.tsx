import React from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';
import { NeonText } from './NeonText';

export interface LeaderboardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  color?: string;
}

const RANK_META: Record<number, { border: string; badge: string; glow: string; color: string }> = {
  1: {
    border: 'border-[2px] border-[#FFD700]/60',
    badge: 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40',
    glow: 'shadow-[0_0_16px_rgba(255,215,0,0.2)]',
    color: '#FFD700',
  },
  2: {
    border: 'border-[2px] border-[#C0C0C0]/50',
    badge: 'bg-[#C0C0C0]/15 text-[#C0C0C0] border border-[#C0C0C0]/30',
    glow: 'shadow-[0_0_12px_rgba(192,192,192,0.15)]',
    color: '#C0C0C0',
  },
  3: {
    border: 'border-[2px] border-[#CD7F32]/50',
    badge: 'bg-[#CD7F32]/15 text-[#CD7F32] border border-[#CD7F32]/30',
    glow: 'shadow-[0_0_12px_rgba(205,127,50,0.15)]',
    color: '#CD7F32',
  },
};

/** Returns the NeonText color for rank/user context */
function getRankColor(rank: number, isCurrentUser: boolean, userColor: string): string {
  if (isCurrentUser) return userColor;
  return RANK_META[rank]?.color ?? 'currentColor';
}

export const LeaderboardItem = React.forwardRef<HTMLDivElement, LeaderboardItemProps>(
  ({ className, rank, name, score, avatarUrl, isCurrentUser = false, color = '#00E5FF', ...props }, ref) => {
    const topMeta = RANK_META[rank];
    const accentColor = getRankColor(rank, isCurrentUser, color);

    return (
      <GlassCard
        ref={ref}
        variant={isCurrentUser ? 'neon' : 'base'}
        glow={isCurrentUser}
        glowColor={color}
        className={cn(
          'flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300',
          topMeta ? topMeta.border : '',
          topMeta ? topMeta.glow : '',
          className,
        )}
        {...props}
      >
        {/* Rank badge */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shrink-0">
          <NeonText
            color={accentColor}
            glow={isCurrentUser || !!topMeta}
            intensity="low"
            className="font-mono text-sm text-slate-900 dark:text-white"
          >
            #{rank}
          </NeonText>
        </div>

        {/* Avatar */}
        <div
          className="relative w-12 h-12 rounded-full overflow-hidden border-2 shrink-0"
          style={{ borderColor: isCurrentUser ? color : topMeta ? topMeta.color : 'rgba(128,128,128,0.2)' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <span className="text-slate-500 dark:text-white/50 font-bold">{name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">{name}</h3>
            {rank === 1 && (
              <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0', RANK_META[1].badge)}>
                KING
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-white/50">Territory Controlled</p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0 max-w-[80px] min-w-0">
          <NeonText
            color={accentColor}
            glow={isCurrentUser || !!topMeta}
            intensity="low"
            className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums truncate block"
          >
            {score}
          </NeonText>
          <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-wider">m²</p>
        </div>
      </GlassCard>
    );
  }
);

LeaderboardItem.displayName = 'LeaderboardItem';
