/**
 * Firebase Cloud Functions — entry point.
 *
 * The Firebase Admin SDK is initialised here (once) before any function
 * module is imported so that all modules share the same app instance.
 */

import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { resolveConflict } from './conflictResolution';
export { applyDecay } from './strengthDecay';
export { calculateLeaderboard } from './leaderboardCalc';
