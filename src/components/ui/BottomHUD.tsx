import React from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';
import { StatsDisplay } from './StatsDisplay';
import { FABButton } from './FABButton';
import { Play, Pause, Square } from 'lucide-react';

export interface BottomHUDProps extends React.HTMLAttributes<HTMLDivElement> {
  isRunning: boolean;
  isPaused: boolean;
  distance: string;
  pace: string;
  time: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const BottomHUD = React.forwardRef<HTMLDivElement, BottomHUDProps>(
  ({ className, isRunning, isPaused, distance, pace, time, onStart, onPause, onResume, onStop, ...props }, ref) => {
    return (
      <section
        aria-label="Live Run Tracking Dashboard"
        ref={ref}
        className={cn('fixed bottom-0 left-0 right-0 p-4 pb-8 z-50', className)}
        {...props}
      >
        <GlassCard variant="elevated" className="max-w-md mx-auto p-6 rounded-[32px] flex flex-col gap-6 w-full">
          <div className="flex justify-evenly items-center w-full">
            <StatsDisplay className="flex-1" label="Distance" value={distance} unit="km" colorClass="text-[#008B99] dark:text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,139,153,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
            <div className="w-[1px] h-10 bg-slate-300 dark:bg-white/10 shrink-0" />
            <StatsDisplay className="flex-1" label="Pace" value={pace} unit="/km" colorClass="text-[#5A1CB3] dark:text-[#7B2FFF] drop-shadow-[0_0_8px_rgba(90,28,179,0.8)] dark:drop-shadow-[0_0_8px_rgba(123,47,255,0.8)]" />
            <div className="w-[1px] h-10 bg-slate-300 dark:bg-white/10 shrink-0" />
            <StatsDisplay className="flex-1" label="Time" value={time} colorClass="text-[#B38000] dark:text-[#FFB800] drop-shadow-[0_0_8px_rgba(179,128,0,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          </div>

          <div className="flex justify-center items-center gap-4">
            {!isRunning && !isPaused && (
              <FABButton aria-label="Start Run" className="w-full py-4 text-lg" onClick={onStart}>
                <Play size={24} className="mr-2" /> Start Run
              </FABButton>
            )}

            {(isRunning || isPaused) && (
              <>
                <FABButton
                  aria-label={isPaused ? "Resume Run" : "Pause Run"}
                  className="w-16 h-16 rounded-full p-0 flex items-center justify-center bg-slate-200/50 dark:bg-white/10 border border-slate-300 dark:border-white/20"
                  onClick={isPaused ? onResume : onPause}
                >
                  {isPaused ? <Play aria-hidden="true" size={24} className="text-[#008B99] dark:text-[#00E5FF]" /> : <Pause aria-hidden="true" size={24} className="text-[#B38000] dark:text-[#FFB800]" />}
                </FABButton>
                
                <FABButton
                  aria-label="Stop Run"
                  className="w-16 h-16 rounded-full p-0 flex items-center justify-center bg-[#B32A78]/10 dark:bg-[#FF3CAC]/15 border border-[#B32A78]/30 dark:border-[#FF3CAC]/30"
                  onClick={onStop}
                >
                  <Square aria-hidden="true" size={24} className="text-[#B32A78] dark:text-[#FF3CAC]" />
                </FABButton>
              </>
            )}
          </div>
        </GlassCard>
      </section>
    );
  }
);

BottomHUD.displayName = 'BottomHUD';
