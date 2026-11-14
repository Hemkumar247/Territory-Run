import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/browser';
import { initGA } from './lib/analytics';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// PROBLEM: How can AI help users stay motivated in their health and wellness journey through gamification and territory optimization?
// SOLUTION: Territory-Run solves this by orchestrating a Gemini AI layer that dynamically calculates optimized physical loops, turning mundane fitness tracking into a real-time, logic-driven multiplayer strategy game.

const SENTRY_DSN = (import.meta as any).env?.VITE_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: (import.meta as any).env?.MODE || 'development',
  });
}

if ((import.meta as any).env?.MODE === 'production') {
  initGA();
}

if (!Capacitor.isNativePlatform()) registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
