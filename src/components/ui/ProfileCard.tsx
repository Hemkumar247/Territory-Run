import React from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';
import { NeonText } from './NeonText';
import { StatsDisplay } from './StatsDisplay';

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  avatarUrl?: string;
  totalDistance: number;
  totalRuns: number;
  territoryControlled: number;
  color?: string;
}

export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ className, name, level, xp, nextLevelXp, avatarUrl, totalDistance, totalRuns, territoryControlled, color = '#7B2FFF', ...props }, ref) => {
    
    const progress = Math.min(100, Math.max(0, (xp / nextLevelXp) * 100));

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

        <div className="grid grid-cols-3 gap-4">
          <StatsDisplay label="Distance" value={totalDistance} unit="km" colorClass="text-[#008B99] dark:text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,139,153,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
          <StatsDisplay label="Runs" value={totalRuns} colorClass="text-[#B38000] dark:text-[#FFB800] drop-shadow-[0_0_8px_rgba(179,128,0,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          <StatsDisplay label="Territory" value={territoryControlled} unit="sq km" colorClass="text-[#B32A78] dark:text-[#FF3CAC] drop-shadow-[0_0_8px_rgba(179,42,120,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,60,172,0.8)]" />
        </div>
      </GlassCard>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';
