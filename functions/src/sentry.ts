/**
 * Sentry integration for Cloud Functions.
 *
 * Call `initSentry()` once at module load time (before exporting any function).
 * In development / test environments set SENTRY_DSN to an empty string to
 * disable Sentry without changing code.
 */

import * as Sentry from '@sentry/node';

let initialised = false;

export function initSentry(): void {
  if (initialised) return;
  initialised = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[Sentry] SENTRY_DSN not set — error reporting disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV ?? 'production',
    release: process.env.APP_VERSION,
    tracesSampleRate: 0.2,
    integrations: [
      Sentry.httpIntegration(),
    ],
  });

  console.log('[Sentry] Initialised for Cloud Functions.');
}

/**
 * Captures an exception and flushes Sentry before the Cloud Function runtime
 * tears down the process (Sentry buffers events asynchronously).
 */
export async function captureException(err: unknown): Promise<void> {
  Sentry.captureException(err);
  await Sentry.flush(2000);
}
