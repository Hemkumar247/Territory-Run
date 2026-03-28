"use strict";
/**
 * Cloud Function: Territory Strength Decay
 *
 * Schedule: every 6 hours.
 *
 * For each user in Firestore, checks `lastActive` and applies a strength
 * multiplier based on inactivity duration:
 *
 *  ≥ 90 days  →  strength = 10 (minimum floor)
 *  ≥ 30 days  →  strength × 0.50
 *  ≥  7 days  →  strength × 0.80
 *  ≥  2 days  →  strength × 0.95
 *
 * Updates `territoryStrength` in both Firestore and the Realtime DB.
 * Logs a decay-event document to /analytics for observability.
 *
 * Territories are never deleted — only their strength is reduced.
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
exports.applyDecay = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const strength_1 = require("./utils/strength");
const sentry_1 = require("./sentry");
(0, sentry_1.initSentry)();
exports.applyDecay = (0, scheduler_1.onSchedule)({
    schedule: 'every 6 hours',
    region: 'us-central1',
    timeoutSeconds: 540,
}, async () => {
    const firestore = admin.firestore();
    const rtdb = admin.database();
    const nowMs = Date.now();
    console.log('[strengthDecay] Job started at', new Date(nowMs).toISOString());
    let usersSnap;
    try {
        usersSnap = await firestore.collection('users').get();
    }
    catch (err) {
        await (0, sentry_1.captureException)(err);
        throw err;
    }
    const decayEvents = [];
    // Firestore writes are batched (max 500 ops per batch)
    let batch = firestore.batch();
    let batchCount = 0;
    const MAX_BATCH_OPS = 499;
    // Realtime DB multi-path update object
    const rtdbUpdates = {};
    for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const uid = userDoc.id;
        // Resolve lastActive to a Unix timestamp in ms
        const lastActiveMs = data['lastActive']?.toMillis?.() ??
            (typeof data['lastActive'] === 'number' ? data['lastActive'] : 0);
        const currentStrength = data['territoryStrength'] ?? 0;
        if (currentStrength <= 0)
            continue;
        const newStrength = (0, strength_1.applyStrengthDecay)(currentStrength, lastActiveMs);
        // Only write if there is a meaningful change (avoid noisy no-op writes)
        if (Math.abs(newStrength - currentStrength) < 0.01)
            continue;
        const roundedStrength = Math.max(10, Math.round(newStrength * 100) / 100);
        // Queue Firestore update
        batch.update(userDoc.ref, { territoryStrength: roundedStrength });
        batchCount++;
        // Flush the batch when it approaches the 500-op limit
        if (batchCount >= MAX_BATCH_OPS) {
            await batch.commit();
            batch = firestore.batch();
            batchCount = 0;
        }
        // Queue RTDB updates (both user profile and territory document)
        rtdbUpdates[`/users/${uid}/territoryStrength`] = roundedStrength;
        rtdbUpdates[`/territories/${uid}/strength`] = roundedStrength;
        decayEvents.push({
            uid,
            previousStrength: currentStrength,
            newStrength: roundedStrength,
            decayFactor: roundedStrength / currentStrength,
            lastActive: new Date(lastActiveMs).toISOString(),
            processedAt: new Date(nowMs).toISOString(),
        });
    }
    // Commit any remaining Firestore writes
    if (batchCount > 0) {
        await batch.commit();
    }
    // Apply all RTDB updates in a single multi-path write
    if (Object.keys(rtdbUpdates).length > 0) {
        await rtdb.ref().update(rtdbUpdates);
    }
    // Persist decay analytics
    if (decayEvents.length > 0) {
        await firestore.collection('analytics').add({
            type: 'strength_decay',
            eventCount: decayEvents.length,
            events: decayEvents,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    console.log(`[strengthDecay] Job complete — ${decayEvents.length} users decayed out of ${usersSnap.size} total.`);
});
//# sourceMappingURL=strengthDecay.js.map