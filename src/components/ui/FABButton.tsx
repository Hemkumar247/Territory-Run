import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

export interface FABButtonProps extends HTMLMotionProps<"button"> {
  icon?: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const FABButton = React.forwardRef<HTMLButtonElement, FABButtonProps>(
  ({ className, icon, label, variant = 'primary', children, ...props }, ref) => {
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'liquid-button flex items-center justify-center gap-2 font-display font-bold text-white tracking-wide uppercase text-sm',
          className
        )}
        {...props}
      >
        {icon}
        {label && <span>{label}</span>}
        {children as React.ReactNode}
      </motion.button>
    );
  }
);

FABButton.displayName = 'FABButton';
