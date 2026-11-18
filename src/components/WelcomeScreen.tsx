import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { getUserRank } from '../lib/ranks';
import { Flag, Trophy, Flame, ChevronRight, Map, Activity, Crosshair, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  user: User;
  onClose: () => void;
}

export function WelcomeScreen({ user, onClose }: WelcomeScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const rank = getUserRank(user.totalDistance);
  const km = (user.totalDistance / 1000).toFixed(2);
  const nextAt = rank.nextAt;
  const progress = nextAt ? Math.min(100, (user.totalDistance / 1000 / nextAt) * 100) : 100;

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const quickStats = [
    { icon: <Map className="w-4 h-4" />, value: km, label: 'KM', color: '#00E5FF' },
    { icon: <Flame className="w-4 h-4" />, value: user.currentStreak || 0, label: 'Streak', color: '#FFB800' },
    { icon: <Crosshair className="w-4 h-4" />, value: user.totalRuns || 0, label: 'Runs', color: '#FF3CAC' },
  ];

  return (
    <AnimatePresence>
      {!isStarting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: '#080B12' }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute -top-[30%] -right-[30%] w-[80%] h-[80%] rounded-full blur-[100px]"
              style={{ backgroundColor: `${user.territoryColor}15` }}
            />
            <div 
              className="absolute -bottom-[30%] -left-[30%] w-[60%] h-[60%] rounded-full blur-[100px]"
              style={{ backgroundColor: '#7B2FFF15' }}
            />
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[360px] px-6"
          >
            {/* Header Section */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1, damping: 15 }}
                className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
              >
                {/* Pulsing glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: `${user.territoryColor}20` }}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div 
                  className="relative w-20 h-20 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm"
                  style={{ backgroundColor: `${user.territoryColor}15` }}
                >
                  <span className="text-3xl font-bold" style={{ color: user.territoryColor }}>
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em] mb-2">
                  Welcome Back
                </p>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {user.displayName}
                </h1>
              </motion.div>
            </div>

            {/* Rank Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/10 p-5 mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${user.territoryColor}20` }}
                  >
                    <Trophy className="w-5 h-5" style={{ color: user.territoryColor }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{rank.title}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Level {rank.level}</p>
                  </div>
                </div>
                <div 
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ 
                    backgroundColor: `${user.territoryColor}20`,
                    color: user.territoryColor
                  }}
                >
                  {Math.round(progress)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: user.territoryColor }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-white/30 text-[10px]">to Rank Up</p>
                <p className="text-white/50 text-[10px]">{km} / {nextAt} km</p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              {quickStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="rounded-xl border border-white/5 p-3 text-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleStart}
              className="w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-wider transition-all relative overflow-hidden group"
              style={{ 
                backgroundColor: user.territoryColor,
                color: '#000'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
                style={{ opacity: 0.2 }}
              />
              <Zap className="w-5 h-5 fill-current" />
              <span>Start Running</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            {/* Subtle hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-white/20 text-[10px] mt-4"
            >
              Tap button to begin claiming territory
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeScreen;
