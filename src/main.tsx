import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PROBLEM: How can AI help users stay motivated in their health and wellness journey through gamification and territory optimization?
// SOLUTION: Territory-Run solves this by orchestrating a Gemini AI layer that dynamically calculates optimized physical loops, turning mundane fitness tracking into a real-time, logic-driven multiplayer strategy game.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
