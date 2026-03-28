/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { AuthScreen } from './components/AuthScreen';
import { MapScreen } from './components/MapScreen';
import { Map } from 'lucide-react';

function SplashLoader() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#080B12] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full blur-[120px] bg-[#00E5FF]/10 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[120px] bg-[#7B2FFF]/10 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_0_30px_rgba(0,229,255,0.15)]">
          <Map className="h-8 w-8 text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="font-display font-bold text-2xl text-[#F0F4FF] tracking-tight">Territory Run</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[rgba(240,244,255,0.4)]">Initializing…</p>
        </div>
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"
              style={{ animation: `recording-blink 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Main() {
  const { isAuthReady, authUser } = useFirebase();

  if (!isAuthReady) {
    return <SplashLoader />;
  }

  if (!authUser) {
    return <AuthScreen />;
  }

  return <MapScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Main />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
