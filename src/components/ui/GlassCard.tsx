import React from 'react';
import { cn } from '../../lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'neon';
  glow?: boolean;
  glowColor?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'base', glow = false, glowColor, style, children, ...props }, ref) => {
    const variantClasses = {
      base: 'glass-card-base',
      elevated: 'glass-card-elevated',
      neon: 'glass-card-neon',
    };

    // If glowColor is provided, we override the default box-shadow for the neon variant or add it to others
    const customGlowStyle = glow && glowColor ? {
      boxShadow: `0 0 20px ${glowColor}26, 0 0 60px ${glowColor}0D, inset 0 1px 0 ${glowColor}33`,
      borderColor: `${glowColor}40`,
      backgroundColor: `${glowColor}14`
    } : {};

    return (
      <div
        ref={ref}
        role="article"
        className={cn(
          variantClasses[variant],
          className
        )}
        style={{
          ...customGlowStyle,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
