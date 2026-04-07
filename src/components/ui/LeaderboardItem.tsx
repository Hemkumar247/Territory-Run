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

export const LeaderboardItem = React.forwardRef<HTMLDivElement, LeaderboardItemProps>(
  ({ className, rank, name, score, avatarUrl, isCurrentUser = false, color = '#00E5FF', ...props }, ref) => {
    return (
      <GlassCard
        ref={ref}
        variant={isCurrentUser ? 'neon' : 'base'}
        glow={isCurrentUser}
        glowColor={color}
        className={cn('flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300', className)}
        {...props}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <NeonText
            color={isCurrentUser ? color : 'currentColor'}
            glow={isCurrentUser}
            intensity="low"
            className="font-mono text-sm text-slate-900 dark:text-white"
          >
            #{rank}
          </NeonText>
        </div>

        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: isCurrentUser ? color : 'rgba(128,128,128,0.2)' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <span className="text-slate-500 dark:text-white/50 font-bold">{name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">{name}</h3>
          <p className="text-xs text-slate-500 dark:text-white/50">Territory Controlled</p>
        </div>

        <div className="text-right">
          <NeonText
            color={isCurrentUser ? color : 'currentColor'}
            glow={isCurrentUser}
            intensity="low"
            className="font-mono text-xl font-bold text-slate-900 dark:text-white"
          >
            {score}
          </NeonText>
          <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-wider">sq km</p>
        </div>
      </GlassCard>
    );
  }
);

LeaderboardItem.displayName = 'LeaderboardItem';
