import React from 'react';
import { User } from '../types';
import { getUserRank } from '../lib/ranks';
import { Map, Trophy, Play } from 'lucide-react';

interface WelcomeModalProps {
  user: User;
  onClose: () => void;
}

export function WelcomeModal({ user, onClose }: WelcomeModalProps) {
  const rank = getUserRank(user.totalDistance);
  const km = (user.totalDistance / 1000).toFixed(2);
  const nextAt = rank.nextAt;
  const progress = nextAt ? Math.min(100, (user.totalDistance / 1000 / nextAt) * 100) : 100;

  return (
    <div className="absolute inset-0 z-[5000] flex items-center justify-center bg-slate-100/80 dark:bg-[#050505]/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-sm glass-panel bg-white/90 dark:bg-black/40 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10">
        {/* Background glow */}
        <div 
          className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-[80px] opacity-30 mix-blend-screen"
          style={{ backgroundColor: user.territoryColor }}
        />
        
        <div className="relative z-10">
          <div 
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-8 border border-black/10 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            style={{ backgroundColor: `${user.territoryColor}20` }}
          >
            <Map className="h-10 w-10 text-slate-900 dark:text-white opacity-90" />
          </div>
          
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Welcome back,</h2>
          <p className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-8 tracking-wide truncate px-4">{user.displayName}</p>
          
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 mb-8 border border-black/5 dark:border-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em]">Level {rank.level} • {rank.title}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest mb-1">Total Distance</p>
            <p className="text-slate-900 dark:text-white font-display font-bold text-2xl">{km} <span className="text-sm text-slate-600 dark:text-slate-400 font-sans">km</span></p>
            
            {nextAt && (
              <div className="mt-5">
                <div className="w-full bg-black/10 dark:bg-black/50 rounded-full h-1.5 overflow-hidden border border-black/5 dark:border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]" 
                    style={{ width: `${progress}%`, backgroundColor: user.territoryColor }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-widest">
                  {(nextAt - parseFloat(km)).toFixed(2)} km to next level
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-xs font-bold uppercase tracking-widest text-black transition-all duration-300 hover:scale-[0.98]"
            style={{ backgroundColor: user.territoryColor, boxShadow: `0 0 20px ${user.territoryColor}40` }}
          >
            <Play className="h-4 w-4 fill-current" />
            Initialize Run
          </button>
        </div>
      </div>
    </div>
  );
}
