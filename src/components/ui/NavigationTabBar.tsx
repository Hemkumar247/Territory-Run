import React from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';
import { Map, Trophy, User, Settings, Activity, Users } from 'lucide-react';
import { motion } from 'motion/react';

export interface NavigationTabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: 'map' | 'leaderboard' | 'history' | 'profile' | 'settings' | 'social';
  onTabChange: (tab: 'map' | 'leaderboard' | 'history' | 'profile' | 'settings' | 'social') => void;
}

export const NavigationTabBar = React.forwardRef<HTMLDivElement, NavigationTabBarProps>(
  ({ className, activeTab, onTabChange, ...props }, ref) => {
    
    const tabs = [
      { id: 'map', icon: Map, label: 'Map', colorClass: 'text-[#008B99] dark:text-[#00E5FF]', bgClass: 'bg-[#008B99]/10 dark:bg-[#00E5FF]/15', shadowClass: 'shadow-[0_0_20px_rgba(0,139,153,0.2),inset_0_0_10px_rgba(0,139,153,0.1)] dark:shadow-[0_0_20px_rgba(0,229,255,0.2),inset_0_0_10px_rgba(0,229,255,0.1)]', dropShadowClass: 'drop-shadow-[0_0_8px_rgba(0,139,153,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' },
      { id: 'leaderboard', icon: Trophy, label: 'Ranks', colorClass: 'text-[#B38000] dark:text-[#FFB800]', bgClass: 'bg-[#B38000]/10 dark:bg-[#FFB800]/15', shadowClass: 'shadow-[0_0_20px_rgba(179,128,0,0.2),inset_0_0_10px_rgba(179,128,0,0.1)] dark:shadow-[0_0_20px_rgba(255,184,0,0.2),inset_0_0_10px_rgba(255,184,0,0.1)]', dropShadowClass: 'drop-shadow-[0_0_8px_rgba(179,128,0,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]' },
      { id: 'history', icon: Activity, label: 'History', colorClass: 'text-[#E53935] dark:text-[#FF5252]', bgClass: 'bg-[#E53935]/10 dark:bg-[#FF5252]/15', shadowClass: 'shadow-[0_0_20px_rgba(229,57,53,0.2),inset_0_0_10px_rgba(229,57,53,0.1)] dark:shadow-[0_0_20px_rgba(255,82,82,0.2),inset_0_0_10px_rgba(255,82,82,0.1)]', dropShadowClass: 'drop-shadow-[0_0_8px_rgba(229,57,53,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,82,82,0.8)]' },
      { id: 'social', icon: Users, label: 'Social', colorClass: 'text-[#10B981] dark:text-[#34D399]', bgClass: 'bg-[#10B981]/10 dark:bg-[#34D399]/15', shadowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.2),inset_0_0_10px_rgba(16,185,129,0.1)] dark:shadow-[0_0_20px_rgba(52,211,153,0.2),inset_0_0_10px_rgba(52,211,153,0.1)]', dropShadowClass: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' },
      { id: 'profile', icon: User, label: 'Profile', colorClass: 'text-[#5A1CB3] dark:text-[#7B2FFF]', bgClass: 'bg-[#5A1CB3]/10 dark:bg-[#7B2FFF]/15', shadowClass: 'shadow-[0_0_20px_rgba(90,28,179,0.2),inset_0_0_10px_rgba(90,28,179,0.1)] dark:shadow-[0_0_20px_rgba(123,47,255,0.2),inset_0_0_10px_rgba(123,47,255,0.1)]', dropShadowClass: 'drop-shadow-[0_0_8px_rgba(90,28,179,0.8)] dark:drop-shadow-[0_0_8px_rgba(123,47,255,0.8)]' },
      { id: 'settings', icon: Settings, label: 'Settings', colorClass: 'text-slate-700 dark:text-[#F0F4FF]', bgClass: 'bg-slate-700/10 dark:bg-[#F0F4FF]/15', shadowClass: 'shadow-[0_0_20px_rgba(51,65,85,0.2),inset_0_0_10px_rgba(51,65,85,0.1)] dark:shadow-[0_0_20px_rgba(240,244,255,0.2),inset_0_0_10px_rgba(240,244,255,0.1)]', dropShadowClass: 'drop-shadow-[0_0_8px_rgba(51,65,85,0.8)] dark:drop-shadow-[0_0_8px_rgba(240,244,255,0.8)]' },
    ] as const;

    return (
      <div
        ref={ref}
        className={cn('fixed bottom-0 left-0 right-0 p-4 pb-8 z-[3000] pointer-events-none', className)}
        {...props}
      >
        <GlassCard variant="base" className="max-w-md mx-auto rounded-[24px] pointer-events-auto flex justify-around items-center p-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-16 h-14 rounded-[16px] transition-colors duration-300",
                  isActive ? tab.bgClass : "bg-transparent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={cn(
                      "absolute inset-0 rounded-[16px] border border-black/5 dark:border-white/10",
                      tab.shadowClass
                    )}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={24}
                  className={cn(
                    "mb-1 transition-all duration-300",
                    isActive ? cn(tab.colorClass, tab.dropShadowClass) : "text-slate-400 dark:text-white/40"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide transition-colors duration-300",
                    isActive ? tab.colorClass : "text-slate-400 dark:text-white/40"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </GlassCard>
      </div>
    );
  }
);

NavigationTabBar.displayName = 'NavigationTabBar';
