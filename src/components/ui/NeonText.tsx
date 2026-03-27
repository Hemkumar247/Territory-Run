import React from 'react';
import { cn } from '../../lib/utils';

export interface NeonTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  glow?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const NeonText = React.forwardRef<HTMLSpanElement, NeonTextProps>(
  ({ className, color = '#00E5FF', glow = true, intensity = 'medium', style, children, ...props }, ref) => {
    
    let blurRadius = '20px';
    if (intensity === 'low') blurRadius = '10px';
    if (intensity === 'high') blurRadius = '30px';

    const glowStyle = glow ? {
      textShadow: `0 0 ${blurRadius} ${color === 'currentColor' ? 'currentColor' : color}`,
      color: color === 'currentColor' ? undefined : color,
    } : {
      color: color === 'currentColor' ? undefined : color,
    };

    return (
      <span
        ref={ref}
        className={cn('font-display font-bold tracking-tight', className)}
        style={{
          ...glowStyle,
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

NeonText.displayName = 'NeonText';
