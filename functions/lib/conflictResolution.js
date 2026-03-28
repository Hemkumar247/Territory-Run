"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConflict = void 0;
const admin = __importStar(require("firebase-admin"));
const database_1 = require("firebase-functions/v2/database");
const geometry_1 = require("./utils/geometry");
const strength_1 = require("./utils/strength");
const sentry_1 = require("./sentry");
(0, sentry_1.initSentry)();
// Exit the rival loop 1 s before the hard timeout so there is time to flush.
const SOFT_TIMEOUT_MS = 9000;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getSessionCount(rtdb, uid) {
    const snap = await rtdb.ref(`sessions/${uid}`).once('value');
    if (!snap.exists())
        return 0;
    return Object.keys(snap.val()).length;
}
async function sendPushNotification(uid, title, body) {
    try {
        const userSnap = await admin.firestore().collection('users').doc(uid).get();
        if (!userSnap.exists)
            return;
        const fcmToken = userSnap.data().fcmToken;
        if (!fcmToken)
            return;
        await admin.messaging().send({ token: fcmToken, notification: { title, body } });
    }
    catch (err) {
        console.error(`[conflictResolution] Failed to send push to ${uid}:`, err);
    }
}
// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------
exports.resolveConflict = (0, database_1.onValueUpdated)({
    ref: '/territories/{uid}/coordinates',
    region: 'us-central1',
    timeoutSeconds: 60,
}, async (event) => {
    const startMs = Date.now();
    const uid = event.params['uid'];
    const rtdb = admin.database();
    // --- Idempotency lock ---------------------------------------------------
    // Prevent duplicate processing if the function is retried within 5 seconds.
    const lockRef = rtdb.ref(`_processing/conflicts/${uid}`);
    const lockSnap = await lockRef.once('value');
    const lastProcessedMs = lockSnap.val();
    if (lastProcessedMs && Date.now() - lastProcessedMs < 5000) {
        console.log(`[conflictResolution] Skipping duplicate run for uid=${uid}`);
        return;
    }
    await lockRef.set(Date.now());
    // --- Validate updated coordinates ---------------------------------------
    const newCoordinates = event.data.after.val();
    if (!newCoordinates || newCoordinates.length < 3) {
        console.log(`[conflictResolution] Skipping uid=${uid}: insufficient coordinates`);
        return;
    }
    // --- Fetch all territories ----------------------------------------------
    let allTerritoriesSnap;
    try {
        allTerritoriesSnap = await rtdb.ref('/territories').once('value');
    }
    catch (err) {
        await (0, sentry_1.captureException)(err);
        throw err;
    }
    if (!allTerritoriesSnap.exists())
        return;
    const allTerritories = allTerritoriesSnap.val();
    // --- Fetch current user data --------------------------------------------
    const currentUserSnap = await rtdb.ref(`/users/${uid}`).once('value');
    if (!currentUserSnap.exists())
        return;
    const currentUser = currentUserSnap.val();
    const currentSessions = await getSessionCount(rtdb, uid);
    const currentStrength = (0, strength_1.calculateStrength)({
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
        if (rivalUid === uid)
            continue;
        const rivalTerritory = allTerritories[rivalUid];
        if (!rivalTerritory.coordinates || rivalTerritory.coordinates.length < 3)
            continue;
        if (!(0, geometry_1.polygonsOverlap)(newCoordinates, rivalTerritory.coordinates))
            continue;
        console.log(`[conflictResolution] Overlap: uid=${uid} vs rivalUid=${rivalUid}`);
        // Fetch rival user data for strength calculation
        const rivalUserSnap = await rtdb.ref(`/users/${rivalUid}`).once('value');
        if (!rivalUserSnap.exists())
            continue;
        const rivalUser = rivalUserSnap.val();
        const rivalSessions = await getSessionCount(rtdb, rivalUid);
        const rivalStrength = (0, strength_1.calculateStrength)({
            totalDistanceMeters: rivalUser.totalDistance ?? 0,
            sessionCount: rivalSessions,
            lastActiveMs: rivalUser.lastActive ?? Date.now(),
        });
        const rtdbUpdates = {};
        if (currentStrength > rivalStrength) {
            // Current user wins: clip overlap out of rival's territory
            const trimmedRival = (0, geometry_1.subtractPolygon)(rivalTerritory.coordinates, newCoordinates);
            rtdbUpdates[`/territories/${rivalUid}/coordinates`] =
                trimmedRival.length >= 3 ? trimmedRival : [];
            rtdbUpdates[`/territories/${rivalUid}/lastUpdated`] = Date.now();
            rtdbUpdates[`/users/${uid}/wins`] = (currentUser.wins ?? 0) + 1;
            rtdbUpdates[`/users/${rivalUid}/losses`] = (rivalUser.losses ?? 0) + 1;
            await rtdb.ref().update(rtdbUpdates);
            await sendPushNotification(rivalUid, '⚔️ Territory Captured!', `${currentUser.displayName ?? 'A rival runner'} has taken part of your territory!`);
        }
        else if (currentStrength < rivalStrength) {
            // Rival wins: clip overlap out of current user's territory
            const trimmedCurrent = (0, geometry_1.subtractPolygon)(newCoordinates, rivalTerritory.coordinates);
            rtdbUpdates[`/territories/${uid}/coordinates`] =
                trimmedCurrent.length >= 3 ? trimmedCurrent : [];
            rtdbUpdates[`/territories/${uid}/lastUpdated`] = Date.now();
            await rtdb.ref().update(rtdbUpdates);
            await sendPushNotification(uid, '🛡️ Territory Lost!', 'Your territory overlaps a stronger runner — you lost some ground!');
        }
        // Tie (equal strength) → no change
    }
    // Signal clients to refresh the leaderboard
    await rtdb.ref('/leaderboard_updated').set(Date.now());
});
//# sourceMappingURL=conflictResolution.js.map