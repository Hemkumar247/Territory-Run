import React, { useState } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { User } from './types';

// Demo user data
const demoUser: User = {
  uid: 'demo-123',
  displayName: 'Runner Pro',
  territoryColor: '#00E5FF',
  totalDistance: 45678,
  territoryStrength: 85,
  lastActive: new Date(),
  wins: 12,
  losses: 3,
  currentStreak: 5,
  longestStreak: 8,
  totalRuns: 42,
  photoURL: null,
  preferences: {
    units: 'metric',
    notifications: true,
    publicProfile: true,
  },
};

function Demo() {
  const [view, setView] = useState<'menu' | 'onboarding' | 'welcome'>('menu');

  const handleComplete = () => {
    alert('Onboarding completed! 🎉');
    setView('menu');
  };

  const handleWelcomeClose = () => {
    alert('Welcome screen closed! Ready to run! 🏃');
    setView('menu');
  };

  if (view === 'onboarding') {
    return <OnboardingScreen onComplete={handleComplete} />;
  }

  if (view === 'welcome') {
    return <WelcomeScreen user={demoUser} onClose={handleWelcomeClose} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: '#080B12', color: 'white' }}>
      <h1 className="text-4xl font-bold mb-2">Territory Run</h1>
      <p className="text-white/60 mb-12">Component Preview</p>
      
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => setView('onboarding')}
          className="p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all text-left"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <h2 className="text-xl font-bold mb-2">🚀 Onboarding Flow</h2>
          <p className="text-sm text-white/50">View the new 4-slide onboarding experience</p>
        </button>
        
        <button
          onClick={() => setView('welcome')}
          className="p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all text-left"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <h2 className="text-xl font-bold mb-2">👋 Welcome Screen</h2>
          <p className="text-sm text-white/50">View the redesigned welcome back experience</p>
        </button>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-xs text-white/30">
          Press ESC or click Skip/Close to return to this menu
        </p>
      </div>
    </div>
  );
}

export default Demo;
