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
  /** Territory area in m² (shown when a run is active) */
  territory?: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const BottomHUD = React.forwardRef<HTMLDivElement, BottomHUDProps>(
  ({ className, isRunning, isPaused, distance, pace, time, territory, onStart, onPause, onResume, onStop, ...props }, ref) => {
    const sessionActive = isRunning || isPaused;

    return (
      <div
        ref={ref}
        className={cn('fixed bottom-0 left-0 right-0 p-4 pb-8 z-50', className)}
        {...props}
      >
        <GlassCard variant="elevated" className="max-w-md mx-auto p-5 rounded-[32px] flex flex-col gap-5 w-full">

          {/* Stats row — always visible */}
          <div className="flex justify-evenly items-center w-full">
            <StatsDisplay className="flex-1" label="Distance" value={distance} unit="km" colorClass="text-[#008B99] dark:text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,139,153,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
            <div className="w-[1px] h-10 bg-slate-300 dark:bg-white/10 shrink-0" />
            <StatsDisplay className="flex-1" label="Pace" value={pace} unit="/km" colorClass="text-[#5A1CB3] dark:text-[#7B2FFF] drop-shadow-[0_0_8px_rgba(90,28,179,0.8)] dark:drop-shadow-[0_0_8px_rgba(123,47,255,0.8)]" />
            <div className="w-[1px] h-10 bg-slate-300 dark:bg-white/10 shrink-0" />
            <StatsDisplay className="flex-1" label="Time" value={time} colorClass="text-[#B38000] dark:text-[#FFB800] drop-shadow-[0_0_8px_rgba(179,128,0,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
            {sessionActive && territory !== undefined && (
              <>
                <div className="w-[1px] h-10 bg-slate-300 dark:bg-white/10 shrink-0" />
                <StatsDisplay className="flex-1" label="Territory" value={territory} unit="m²" colorClass="text-[#00875A] dark:text-[#00FF88] drop-shadow-[0_0_8px_rgba(0,135,90,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
              </>
            )}
          </div>

          {/* Controls row */}
          <div className="flex justify-center items-center gap-4">
            {!sessionActive && (
              <FABButton className="w-full py-4 text-lg" breathe onClick={onStart}>
                <Play size={22} className="mr-2" /> Start Run
              </FABButton>
            )}

            {sessionActive && (
              <>
                <FABButton
                  className="w-16 h-16 rounded-full p-0 flex items-center justify-center bg-slate-200/50 dark:bg-white/10 border border-slate-300 dark:border-white/20"
                  onClick={isPaused ? onResume : onPause}
                >
                  {isPaused
                    ? <Play size={24} className="text-[#008B99] dark:text-[#00E5FF]" />
                    : <Pause size={24} className="text-[#B38000] dark:text-[#FFB800]" />}
                </FABButton>

                <FABButton
                  className="w-16 h-16 rounded-full p-0 flex items-center justify-center bg-[#B32A78]/10 dark:bg-[#FF3CAC]/15 border border-[#B32A78]/30 dark:border-[#FF3CAC]/30"
                  onClick={onStop}
                >
                  <Square size={24} className="text-[#B32A78] dark:text-[#FF3CAC]" />
                </FABButton>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }
);

BottomHUD.displayName = 'BottomHUD';
