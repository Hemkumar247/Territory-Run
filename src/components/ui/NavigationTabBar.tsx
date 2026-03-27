import React from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';
import { Map, Trophy, User, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export interface NavigationTabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: 'map' | 'leaderboard' | 'profile' | 'settings';
  onTabChange: (tab: 'map' | 'leaderboard' | 'profile' | 'settings') => void;
}

export const NavigationTabBar = React.forwardRef<HTMLDivElement, NavigationTabBarProps>(
  ({ className, activeTab, onTabChange, ...props }, ref) => {
    
    const tabs = [
      { id: 'map', icon: Map, label: 'Map', color: '#00E5FF' },
      { id: 'leaderboard', icon: Trophy, label: 'Ranks', color: '#FFB800' },
      { id: 'profile', icon: User, label: 'Profile', color: '#7B2FFF' },
      { id: 'settings', icon: Settings, label: 'Settings', color: '#F0F4FF' },
    ] as const;

    return (
      <div
        ref={ref}
        className={cn('fixed bottom-0 left-0 right-0 p-4 pb-8 z-40 pointer-events-none', className)}
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
                className="relative flex flex-col items-center justify-center w-16 h-14 rounded-[16px] transition-colors duration-300"
                style={{
                  backgroundColor: isActive ? `${tab.color}15` : 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-[16px] border border-white/10"
                    style={{
                      boxShadow: `0 0 20px ${tab.color}20, inset 0 0 10px ${tab.color}10`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={24}
                  color={isActive ? tab.color : 'rgba(240, 244, 255, 0.4)'}
                  className="mb-1 transition-colors duration-300"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 8px ${tab.color}80)` : 'none',
                  }}
                />
                <span
                  className="text-[10px] font-medium tracking-wide transition-colors duration-300"
                  style={{
                    color: isActive ? tab.color : 'rgba(240, 244, 255, 0.4)',
                  }}
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
