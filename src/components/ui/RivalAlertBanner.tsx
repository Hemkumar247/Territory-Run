import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';
import { GlassCard } from './GlassCard';
import { AlertCircle } from 'lucide-react';

export interface RivalAlertBannerProps extends HTMLMotionProps<"div"> {
  rivalName: string;
  territoryName: string;
  timeAgo: string;
  color?: string;
  onAction?: () => void;
}

export const RivalAlertBanner = React.forwardRef<HTMLDivElement, RivalAlertBannerProps>(
  ({ className, rivalName, territoryName, timeAgo, color = '#FF3CAC', onAction, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn('w-full max-w-md mx-auto px-4 py-2', className)}
        {...props}
      >
        <GlassCard
          variant="neon"
          glow={true}
          glowColor={color}
          className="flex items-center gap-3 p-3 cursor-pointer"
          onClick={onAction}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
            <AlertCircle size={20} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              <span className="font-bold" style={{ color }}>{rivalName}</span> claimed
            </p>
            <p className="text-xs text-slate-500 dark:text-white/55 truncate">
              {territoryName} • {timeAgo}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ backgroundColor: `${color}20`, color: color }}>
              Defend
            </button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }
);

RivalAlertBanner.displayName = 'RivalAlertBanner';
