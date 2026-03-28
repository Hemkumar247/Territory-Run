/**
 * Environment-aware logger for Territory Run.
 *
 * In production (`__APP_ENV__ === 'production'`):
 *   - errors   → forwarded to Sentry AND console.error
 *   - warnings → forwarded to Sentry as breadcrumbs AND console.warn
 *   - info/debug → swallowed (no console noise in prod)
 *
 * In development / staging:
 *   - all levels → console output only, no Sentry traffic
 *
 * Usage:
 *   import { logger } from './lib/logger';
 *   logger.info('Session started', { uid, distance });
 *   logger.error('Territory save failed', error, { uid });
 */

import { addBreadcrumb, captureException } from './sentry';

declare const __APP_ENV__: string;

type LogData = Record<string, unknown>;

const isProd = (): boolean => {
  try {
    return __APP_ENV__ === 'production';
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Public logger API
// ---------------------------------------------------------------------------

export const logger = {
  /**
   * General informational messages (e.g. "session started", "territory saved").
   * In production these are sent to Sentry as breadcrumbs.
   */
  info(message: string, data?: LogData): void {
    if (isProd()) {
      addBreadcrumb('app', message, data);
    } else {
      console.info(`[INFO] ${message}`, data ?? '');
    }
  },

  /**
   * Warnings that do not interrupt the user flow but should be investigated.
   */
  warn(message: string, data?: LogData): void {
    if (isProd()) {
      addBreadcrumb('app.warning', message, data);
    } else {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
  },

  /**
   * Errors — always sent to Sentry in production; logged to console in dev.
   *
   * @param message  Human-readable description of what failed.
   * @param err      The raw error object (optional).
   * @param context  Additional key-value pairs added as Sentry extras.
   */
  error(message: string, err?: unknown, context?: LogData): void {
    if (isProd()) {
      captureException(err ?? new Error(message), { message, ...context });
    } else {
      console.error(`[ERROR] ${message}`, err ?? '', context ?? '');
    }
  },

  /**
   * Verbose debug output — only printed in development, never forwarded.
   */
  debug(message: string, data?: LogData): void {
    if (!isProd()) {
      console.debug(`[DEBUG] ${message}`, data ?? '');
    }
  },

  // Breadcrumb shorthands for key user actions

  /** Call when a running session begins. */
  sessionStart(uid: string): void {
    this.info('Session started', { uid });
  },

  /** Call when a territory conflict is detected client-side. */
  territoryConflict(currentUid: string, rivalUid: string): void {
    this.info('Territory conflict detected', { currentUid, rivalUid });
  },

  /** Call when the user opens the leaderboard. */
  leaderboardViewed(uid: string): void {
    this.info('Leaderboard viewed', { uid });
  },
};
