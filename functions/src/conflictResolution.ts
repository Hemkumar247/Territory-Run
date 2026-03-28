/**
 * Cloud Function: Territory Conflict Resolution
 *
 * Trigger: onValueUpdated for /territories/{uid}/coordinates in Realtime DB.
 *
 * When a user updates their territory coordinates the function:
 *  1. Fetches all other territories from the Realtime DB.
 *  2. Uses the Sutherland-Hodgman algorithm to detect polygon overlaps.
 *  3. Calculates territory strength for both users.
 *  4. Resolves the conflict (removes overlap from the loser's territory).
 *  5. Updates win/loss counters and sends push notifications.
 *  6. Signals clients that the leaderboard should refresh.
 *
 * Idempotency: a per-uid processing lock in RTDB prevents duplicate runs
 * within a 5-second window.
 *
 * Timeout protection: the loop checks elapsed time and exits gracefully
 * before the 10-second hard limit.
 */

import * as admin from 'firebase-admin';
import { onValueUpdated } from 'firebase-functions/v2/database';
import { polygonsOverlap, subtractPolygon } from './utils/geometry';
import { calculateStrength } from './utils/strength';
import { initSentry, captureException } from './sentry';

initSentry();

// Exit the rival loop 1 s before the hard timeout so there is time to flush.
const SOFT_TIMEOUT_MS = 9_000;

// ---------------------------------------------------------------------------
// Types (matching the Realtime DB schema in database.rules.json)
// ---------------------------------------------------------------------------

interface Coordinate {
  lat: number;
  lng: number;
}

interface RtdbTerritory {
  uid: string;
  coordinates: Coordinate[];
  strength: number;
  lastUpdated: number;
  areaKm2: number;
}

interface RtdbUser {
  uid?: string;
  displayName?: string;
  totalDistance?: number;
  territoryStrength?: number;
  wins?: number;
  losses?: number;
  lastActive?: number;
  fcmToken?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSessionCount(rtdb: admin.database.Database, uid: string): Promise<number> {
  const snap = await rtdb.ref(`sessions/${uid}`).once('value');
  if (!snap.exists()) return 0;
  return Object.keys(snap.val() as Record<string, unknown>).length;
}

async function sendPushNotification(
  uid: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    const userSnap = await admin.firestore().collection('users').doc(uid).get();
    if (!userSnap.exists) return;

    const fcmToken = (userSnap.data() as { fcmToken?: string }).fcmToken;
    if (!fcmToken) return;

    await admin.messaging().send({ token: fcmToken, notification: { title, body } });
  } catch (err) {
    console.error(`[conflictResolution] Failed to send push to ${uid}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------

export const resolveConflict = onValueUpdated(
  {
    ref: '/territories/{uid}/coordinates',
    region: 'us-central1',
    timeoutSeconds: 60,
  },
  async (event) => {
    const startMs = Date.now();
    const uid: string = event.params['uid'];

    const rtdb = admin.database();

    // --- Idempotency lock ---------------------------------------------------
    // Prevent duplicate processing if the function is retried within 5 seconds.
    const lockRef = rtdb.ref(`_processing/conflicts/${uid}`);
    const lockSnap = await lockRef.once('value');
    const lastProcessedMs = lockSnap.val() as number | null;
    if (lastProcessedMs && Date.now() - lastProcessedMs < 5_000) {
      console.log(`[conflictResolution] Skipping duplicate run for uid=${uid}`);
      return;
    }
    await lockRef.set(Date.now());

    // --- Validate updated coordinates ---------------------------------------
    const newCoordinates = event.data.after.val() as Coordinate[] | null;
    if (!newCoordinates || newCoordinates.length < 3) {
      console.log(`[conflictResolution] Skipping uid=${uid}: insufficient coordinates`);
      return;
    }

    // --- Fetch all territories ----------------------------------------------
    let allTerritoriesSnap: admin.database.DataSnapshot;
    try {
      allTerritoriesSnap = await rtdb.ref('/territories').once('value');
    } catch (err) {
      await captureException(err);
      throw err;
    }
    if (!allTerritoriesSnap.exists()) return;
    const allTerritories = allTerritoriesSnap.val() as Record<string, RtdbTerritory>;

    // --- Fetch current user data --------------------------------------------
    const currentUserSnap = await rtdb.ref(`/users/${uid}`).once('value');
    if (!currentUserSnap.exists()) return;
    const currentUser = currentUserSnap.val() as RtdbUser;

    const currentSessions = await getSessionCount(rtdb, uid);
    const currentStrength = calculateStrength({
      totalDistanceMeters: currentUser.totalDistance ?? 0,
      sessionCount: currentSessions,
      lastActiveMs: currentUser.lastActive ?? Date.now(),
    });

    // --- Iterate over rival territories ------------------------------------
    for (const rivalUid of Object.keys(allTerritories)) {
      // Soft timeout: stop early to avoid the 10-second hard limit
      if (Date.now() - startMs > SOFT_TIMEOUT_MS) {
        console.warn('[conflictResolution] Soft timeout reached; stopping early.');
        break;
      }

      if (rivalUid === uid) continue;

      const rivalTerritory = allTerritories[rivalUid];
      if (!rivalTerritory.coordinates || rivalTerritory.coordinates.length < 3) continue;

      if (!polygonsOverlap(newCoordinates, rivalTerritory.coordinates)) continue;

      console.log(`[conflictResolution] Overlap: uid=${uid} vs rivalUid=${rivalUid}`);

      // Fetch rival user data for strength calculation
      const rivalUserSnap = await rtdb.ref(`/users/${rivalUid}`).once('value');
      if (!rivalUserSnap.exists()) continue;
      const rivalUser = rivalUserSnap.val() as RtdbUser;

      const rivalSessions = await getSessionCount(rtdb, rivalUid);
      const rivalStrength = calculateStrength({
        totalDistanceMeters: rivalUser.totalDistance ?? 0,
        sessionCount: rivalSessions,
        lastActiveMs: rivalUser.lastActive ?? Date.now(),
      });

      const rtdbUpdates: Record<string, unknown> = {};

      if (currentStrength > rivalStrength) {
        // Current user wins: clip overlap out of rival's territory
        const trimmedRival = subtractPolygon(rivalTerritory.coordinates, newCoordinates);
        rtdbUpdates[`/territories/${rivalUid}/coordinates`] =
          trimmedRival.length >= 3 ? trimmedRival : [];
        rtdbUpdates[`/territories/${rivalUid}/lastUpdated`] = Date.now();
        rtdbUpdates[`/users/${uid}/wins`] = (currentUser.wins ?? 0) + 1;
        rtdbUpdates[`/users/${rivalUid}/losses`] = (rivalUser.losses ?? 0) + 1;

        await rtdb.ref().update(rtdbUpdates);

        await sendPushNotification(
          rivalUid,
          '⚔️ Territory Captured!',
          `${currentUser.displayName ?? 'A rival runner'} has taken part of your territory!`,
        );
      } else if (currentStrength < rivalStrength) {
        // Rival wins: clip overlap out of current user's territory
        const trimmedCurrent = subtractPolygon(newCoordinates, rivalTerritory.coordinates);
        rtdbUpdates[`/territories/${uid}/coordinates`] =
          trimmedCurrent.length >= 3 ? trimmedCurrent : [];
        rtdbUpdates[`/territories/${uid}/lastUpdated`] = Date.now();

        await rtdb.ref().update(rtdbUpdates);

        await sendPushNotification(
          uid,
          '🛡️ Territory Lost!',
          'Your territory overlaps a stronger runner — you lost some ground!',
        );
      }
      // Tie (equal strength) → no change
    }

    // Signal clients to refresh the leaderboard
    await rtdb.ref('/leaderboard_updated').set(Date.now());
  },
);
