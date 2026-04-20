import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

export interface FABButtonProps extends HTMLMotionProps<"button"> {
  icon?: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const FABButton = React.forwardRef<HTMLButtonElement, FABButtonProps>(
  ({ className, icon, label, variant: _variant = 'primary', children, ...props }, ref) => {
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center justify-center gap-2 font-display font-bold tracking-wide uppercase text-sm',
          'px-[28px] py-[14px] rounded-[14px] backdrop-blur-[12px]',
          'bg-gradient-to-br from-[#008B99]/20 to-[#5A1CB3]/15 dark:from-[#00E5FF]/20 dark:to-[#7B2FFF]/15',
          'border border-[#008B99]/30 dark:border-[#00E5FF]/30',
          'shadow-[0_0_24px_rgba(0,139,153,0.2),0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]',
          'dark:shadow-[0_0_24px_rgba(0,229,255,0.2),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'text-slate-800 dark:text-white',
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
