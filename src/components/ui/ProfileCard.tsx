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
          <div className="relative w-24 h-24 rounded-full p-1" style={{ background: `linear-gradient(135deg, ${color}40, transparent)` }}>
            <div className="w-full h-full rounded-full overflow-hidden border-2" style={{ borderColor: color }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/50 text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 rounded-full px-3 py-0.5 backdrop-blur-md">
              <NeonText color={color} intensity="low" className="text-xs font-bold">Lvl {level}</NeonText>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-white mb-1">{name}</h2>
            <p className="text-sm text-white/60 mb-3">Urban Runner</p>
            
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/40 font-mono">{xp} XP</span>
              <span className="text-[10px] text-white/40 font-mono">{nextLevelXp} XP</span>
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-white/10" />

        <div className="grid grid-cols-3 gap-4">
          <StatsDisplay label="Distance" value={totalDistance} unit="km" color="#00E5FF" />
          <StatsDisplay label="Runs" value={totalRuns} color="#FFB800" />
          <StatsDisplay label="Territory" value={territoryControlled} unit="sq km" color="#FF3CAC" />
        </div>
      </GlassCard>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';
