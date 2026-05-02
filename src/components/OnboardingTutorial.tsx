import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Play, Trophy, Crosshair, ChevronRight, Check } from 'lucide-react';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Welcome to Territory Run',
    description: 'Your city is your game board. Physically run to claim territory and build an empire.',
    icon: <Map className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
  },
  {
    title: 'Start Running',
    description: 'Press the glowing PLAY button at the bottom to start tracking. Run in a loop to capture the area inside.',
    icon: <Play className="w-12 h-12 text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
  },
  {
    title: 'Conquer the Leaderboard',
    description: 'Use the bottom tabs to check your stats, view global ranks, and see rival empires.',
    icon: <Trophy className="w-12 h-12 text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
  },
  {
    title: 'Profile & Settings',
    description: 'Tap the neon menu button on the bottom left to access your profile, gear, and app settings.',
    icon: <Crosshair className="w-12 h-12 text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]" />
  }
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-sm rounded-[2rem] bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-8 flex flex-col items-center text-center shadow-2xl"
        >
          {/* Step Indicators */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>

          <div className="mb-6 p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            {steps[currentStep].icon}
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-sm text-slate-300 font-medium leading-relaxed mb-8">
            {steps[currentStep].description}
          </p>

          <button
            onClick={handleNext}
            className="w-full relative overflow-hidden group bg-white text-black font-bold uppercase tracking-widest text-xs py-4 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Let's Run <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
