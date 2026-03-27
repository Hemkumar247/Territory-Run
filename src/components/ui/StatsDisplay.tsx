import React from 'react';
import { cn } from '../../lib/utils';
import { NeonText } from './NeonText';

export interface StatsDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  colorClass?: string;
  glow?: boolean;
}

export const StatsDisplay = React.forwardRef<HTMLDivElement, StatsDisplayProps>(
  ({ className, label, value, unit, color = '#00E5FF', colorClass, glow = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center min-w-0 w-full', className)}
        {...props}
      >
        <span className="text-[11px] font-medium tracking-[0.5px] uppercase text-slate-500 dark:text-white/55 mb-1 truncate w-full text-center">
          {label}
        </span>
        <div className="flex items-baseline gap-1 min-w-0 max-w-full">
          {colorClass ? (
            <span className={cn("font-mono text-xl sm:text-2xl font-bold tracking-tight truncate", colorClass)}>
              {value}
            </span>
          ) : (
            <NeonText
              color={color}
              glow={glow}
              className="font-mono text-xl sm:text-2xl font-bold tracking-tight truncate block"
            >
              {value}
            </NeonText>
          )}
          {unit && (
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-white/55 shrink-0">
              {unit}
            </span>
          )}
        </div>
      </div>
    );
  }
);

StatsDisplay.displayName = 'StatsDisplay';
