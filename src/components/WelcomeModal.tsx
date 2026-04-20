import React, { useState } from 'react';
import { User } from '../types';
import { getUserRank } from '../lib/ranks';
import { Map, Trophy, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeModalProps {
  user: User;
  onClose: () => void;
}

export function WelcomeModal({ user, onClose }: WelcomeModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const rank = getUserRank(user.totalDistance);
  const km = (user.totalDistance / 1000).toFixed(2);
  const nextAt = rank.nextAt;
  const progress = nextAt ? Math.min(100, (user.totalDistance / 1000 / nextAt) * 100) : 100;

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      onClose();
    }, 800); // Wait for animation to finish
  };

  return (
    <AnimatePresence>
      {!isStarting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 z-[5000] flex items-center justify-center bg-slate-100/80 dark:bg-[#050505]/80 backdrop-blur-md p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0, y: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm glass-panel bg-white/90 dark:bg-black/40 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10"
          >
            {/* Background glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-[80px] mix-blend-screen"
              style={{ backgroundColor: user.territoryColor }}
            />
            
            <div className="relative z-10">
              <motion.div 
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2, damping: 15 }}
                className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-8 border border-black/10 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                style={{ backgroundColor: `${user.territoryColor}20` }}
              >
                <Map className="h-10 w-10 text-slate-900 dark:text-white opacity-90" />
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1 tracking-tight"
              >
                Welcome back,
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-8 tracking-wide truncate px-4"
              >
                {user.displayName}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 mb-8 border border-black/5 dark:border-white/5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em]">Level {rank.level} • {rank.title}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest mb-1">Total Distance</p>
                <p className="text-slate-900 dark:text-white font-display font-bold text-2xl">{km} <span className="text-sm text-slate-600 dark:text-slate-400 font-sans">km</span></p>
                
                {nextAt && (
                  <div className="mt-5">
                    <div className="w-full bg-black/10 dark:bg-black/50 rounded-full h-1.5 overflow-hidden border border-black/5 dark:border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full shadow-[0_0_10px_currentColor]" 
                        style={{ backgroundColor: user.territoryColor }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-widest">
                      {(nextAt - parseFloat(km)).toFixed(2)} km to next level
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleStart}
                className="w-full relative overflow-hidden group flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all duration-300"
                style={{ backgroundColor: user.territoryColor, boxShadow: `0 0 20px ${user.territoryColor}40` }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <Flag className="h-5 w-5 fill-current" />
                Start Building Empire
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
