import * as Sentry from '@sentry/react';
import { browserTracingIntegration } from '@sentry/browser';

const SENTRY_DSN = (import.meta as any).env?.VITE_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: (import.meta as any).env?.MODE || 'development',
    beforeSend(event) {
      if (event.exception) {
        return event;
      }
      return event;
    },
  });
}

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Sentry not configured:', error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry:${level}]`, message);
  }
};

export const setUserContext = (user: { id: string; email?: string; username?: string } | null) => {
  if (SENTRY_DSN) {
    Sentry.setUser(user);
  }
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

export { Sentry };