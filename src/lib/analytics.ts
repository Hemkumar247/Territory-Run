declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || '';

export function initGA(): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, parameters);
}

export function trackPageView(path: string, title?: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}

export function setUserProperties(userId: string, properties: Record<string, string | number | boolean>): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('set', { user_id: userId, ...properties });
}

export const AnalyticsEvents = {
  RUN_STARTED: 'run_started',
  RUN_COMPLETED: 'run_completed',
  RUN_PAUSED: 'run_paused',
  RUN_RESUMED: 'run_resumed',
  TERRITORY_CLAIMED: 'territory_claimed',
  TERRITORY_CONTESTED: 'territory_contested',
  TERRITORY_LOST: 'territory_lost',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEVEL_UP: 'level_up',
  STREAK_MILESTONE: 'streak_milestone',
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  GOOGLE_SIGN_IN: 'google_sign_in',
  MAP_VIEWED: 'map_viewed',
  LEADERBOARD_VIEWED: 'leaderboard_viewed',
  PROFILE_VIEWED: 'profile_viewed',
  SETTINGS_CHANGED: 'settings_changed',
  PWA_INSTALLED: 'pwa_installed',
  NOTIFICATION_PERMISSION_GRANTED: 'notification_permission_granted',
  SIMULATION_USED: 'simulation_used',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];