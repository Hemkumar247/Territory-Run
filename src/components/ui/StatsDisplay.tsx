import React from 'react';
import { cn } from '../../lib/utils';
import { NeonText } from './NeonText';

export interface StatsDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  glow?: boolean;
}

export const StatsDisplay = React.forwardRef<HTMLDivElement, StatsDisplayProps>(
  ({ className, label, value, unit, color = '#00E5FF', glow = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center', className)}
        {...props}
      >
        <span className="text-[11px] font-medium tracking-[0.5px] uppercase text-white/55 mb-1">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <NeonText
            color={color}
            glow={glow}
            className="font-mono text-[28px] font-bold tracking-tight"
          >
            {value}
          </NeonText>
          {unit && (
            <span className="text-sm font-medium text-white/55">
              {unit}
            </span>
          )}
        </div>
      </div>
    );
  }
);

StatsDisplay.displayName = 'StatsDisplay';
