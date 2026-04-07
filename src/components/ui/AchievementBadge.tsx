import React from 'react';
import { ACHIEVEMENTS } from '../../lib/achievements';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';

export function AchievementBadge({ id, size = 'md' }: { id: string, size?: 'sm' | 'md' | 'lg' }) {
  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  if (!achievement) return null;

  // Dynamically get the icon component from lucide-react
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;

  const sizeClasses = {
    sm: 'px-2 py-1 text-[9px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2'
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 18
  };

  return (
    <div 
      className={cn(
        "flex items-center rounded-full font-bold shadow-sm border whitespace-nowrap",
        "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        sizeClasses[size]
      )}
      title={achievement.description}
    >
      <IconComponent size={iconSizes[size]} className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
      <span className="tracking-wide uppercase">{achievement.title}</span>
    </div>
  );
}
