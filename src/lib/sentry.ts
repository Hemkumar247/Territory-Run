/**
 * Sentry initialisation for the Territory Run React client.
 *
 * Call `initSentry()` once, as early as possible in main.tsx (before the
 * React tree renders) so that unhandled exceptions and promise rejections
 * are captured from the very start.
 *
 * In development (VITE_SENTRY_DSN is empty) Sentry is not initialised and
 * all calls are no-ops, so there is no overhead during local development.
 */

import * as Sentry from '@sentry/react';

let initialised = false;

// These are injected by vite.config.ts at build time
declare const __APP_ENV__: string;
declare const __APP_VERSION__: string;

export function initSentry(): void {
  if (initialised) return;
  initialised = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    console.log('[Sentry] VITE_SENTRY_DSN not set — error reporting disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: __APP_ENV__,
    release: `territory-run@${__APP_VERSION__}`,

    // Capture 100 % of sessions in staging/dev; 10 % in production to
    // keep costs manageable.
    replaysSessionSampleRate: __APP_ENV__ === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Performance tracing — sample 20 % of transactions in production
    tracesSampleRate: __APP_ENV__ === 'production' ? 0.2 : 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
}

// ---------------------------------------------------------------------------
// Breadcrumb helpers — call these at key user-action points
// ---------------------------------------------------------------------------

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}

// ---------------------------------------------------------------------------
// User context — call after Firebase Auth resolves
// ---------------------------------------------------------------------------

/**
 * Sets the Sentry user context.  Only the uid is stored — never email or
 * any other PII.
 */
export function setSentryUser(uid: string): void {
  Sentry.setUser({ id: uid });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

// ---------------------------------------------------------------------------
// Manual exception capture
// ---------------------------------------------------------------------------

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}
