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
      <div
        ref={ref}
        className={cn('fixed bottom-0 left-0 right-0 p-4 pb-8 z-50', className)}
        {...props}
      >
        <GlassCard variant="elevated" className="max-w-md mx-auto p-6 rounded-[32px] flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <StatsDisplay label="Distance" value={distance} unit="km" color="#00E5FF" />
            <div className="w-[1px] h-10 bg-white/10" />
            <StatsDisplay label="Pace" value={pace} unit="/km" color="#7B2FFF" />
            <div className="w-[1px] h-10 bg-white/10" />
            <StatsDisplay label="Time" value={time} color="#FFB800" />
          </div>

          <div className="flex justify-center items-center gap-4">
            {!isRunning && !isPaused && (
              <FABButton className="w-full py-4 text-lg" onClick={onStart}>
                <Play size={24} className="mr-2" /> Start Run
              </FABButton>
            )}

            {(isRunning || isPaused) && (
              <>
                <FABButton
                  className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
                  style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                  onClick={isPaused ? onResume : onPause}
                >
                  {isPaused ? <Play size={24} color="#00E5FF" /> : <Pause size={24} color="#FFB800" />}
                </FABButton>
                
                <FABButton
                  className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
                  style={{ background: 'rgba(255, 60, 172, 0.15)', border: '1px solid rgba(255, 60, 172, 0.3)' }}
                  onClick={onStop}
                >
                  <Square size={24} color="#FF3CAC" />
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
