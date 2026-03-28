"use strict";
/**
 * Cloud Function: Leaderboard Calculation
 *
 * Schedule: every 15 minutes.
 *
 * Calculates three leaderboard categories and persists them to Firestore:
 *
 *  • global             — all users, top 100
 *  • city-{slug}        — per-city, top 100 each
 *  • week-{YYYY}-W{WW}  — weekly, resets every Monday, top 100
 *
 * Ranking criteria (in order of precedence):
 *  1. territory area in km²  (descending)
 *  2. territory strength     (descending)
 *  3. wins                   (descending)
 *
 * After writing leaderboard entries, stores every user's current global
 * rank in /users/{uid}/currentRank (even those outside the top 100).
 *
 * Emits /leaderboard_updated in the Realtime DB so clients know to refresh.
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
exports.calculateLeaderboard = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const date_fns_1 = require("date-fns");
const sentry_1 = require("./sentry");
(0, sentry_1.initSentry)();
// ---------------------------------------------------------------------------
// Ranking comparator
// ---------------------------------------------------------------------------
/** Primary: area ↓, Secondary: strength ↓, Tiebreaker: wins ↓ */
function rankComparator(a, b) {
    if (b.areaKm2 !== a.areaKm2)
        return b.areaKm2 - a.areaKm2;
    if (b.territoryStrength !== a.territoryStrength)
        return b.territoryStrength - a.territoryStrength;
    return b.wins - a.wins;
}
// ---------------------------------------------------------------------------
// Helper: write up to 100 ranked entries into a Firestore sub-collection
// ---------------------------------------------------------------------------
const MAX_BATCH_OPS = 499;
async function writeLeaderboardEntries(batch, entriesRef, ranked) {
    for (const entry of ranked.slice(0, 100)) {
        batch.set(entriesRef.doc(entry.uid), entry);
    }
}
// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------
exports.calculateLeaderboard = (0, scheduler_1.onSchedule)({
    schedule: 'every 15 minutes',
    region: 'us-central1',
    timeoutSeconds: 540,
}, async () => {
    const firestore = admin.firestore();
    const rtdb = admin.database();
    const nowMs = Date.now();
    console.log('[leaderboardCalc] Job started at', new Date(nowMs).toISOString());
    // Fetch user profiles and territory metadata in parallel
    let usersSnap;
    let territoriesSnap;
    try {
        [usersSnap, territoriesSnap] = await Promise.all([
            firestore.collection('users').get(),
            firestore.collection('territories').get(),
        ]);
    }
    catch (err) {
        await (0, sentry_1.captureException)(err);
        throw err;
    }
    // Build a uid → areaKm2 lookup from territories
    const territoryAreaMap = new Map();
    for (const doc of territoriesSnap.docs) {
        territoryAreaMap.set(doc.id, doc.data()['areaKm2'] ?? 0);
    }
    // Build a flat array of all users with their ranking data
    const allUsers = usersSnap.docs.map((doc) => {
        const d = doc.data();
        return {
            uid: doc.id,
            displayName: d['displayName'] ?? 'Unknown',
            territoryColor: d['territoryColor'] ?? '#888888',
            areaKm2: territoryAreaMap.get(doc.id) ?? 0,
            territoryStrength: d['territoryStrength'] ?? 0,
            wins: d['wins'] ?? 0,
            city: d['city'],
        };
    });
    // --- Global ranking -----------------------------------------------------
    const globalSorted = [...allUsers]
        .sort(rankComparator)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    let batch = firestore.batch();
    let batchOps = 0;
    const globalDocRef = firestore.collection('leaderboard').doc('global');
    batch.set(globalDocRef, {
        category: 'global',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        entryCount: Math.min(globalSorted.length, 100),
    });
    batchOps++;
    await writeLeaderboardEntries(batch, globalDocRef.collection('entries'), globalSorted);
    batchOps += Math.min(globalSorted.length, 100);
    // --- Per-city rankings --------------------------------------------------
    const citiesMap = new Map();
    for (const user of allUsers) {
        if (user.city) {
            if (!citiesMap.has(user.city))
                citiesMap.set(user.city, []);
            citiesMap.get(user.city).push(user);
        }
    }
    for (const [city, cityUsers] of citiesMap.entries()) {
        const slug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!slug)
            continue;
        const citySorted = [...cityUsers]
            .sort(rankComparator)
            .map((u, i) => ({ ...u, rank: i + 1 }));
        const cityDocRef = firestore.collection('leaderboard').doc(`city-${slug}`);
        batch.set(cityDocRef, {
            category: 'city',
            city,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            entryCount: Math.min(citySorted.length, 100),
        });
        batchOps++;
        await writeLeaderboardEntries(batch, cityDocRef.collection('entries'), citySorted);
        batchOps += Math.min(citySorted.length, 100);
        // Flush approaching limit
        if (batchOps >= MAX_BATCH_OPS) {
            await batch.commit();
            batch = firestore.batch();
            batchOps = 0;
        }
    }
    // --- Weekly ranking -----------------------------------------------------
    const weekStart = (0, date_fns_1.startOfWeek)(new Date(nowMs), { weekStartsOn: 1 }); // Monday
    const weekNum = String((0, date_fns_1.getWeek)(weekStart, { weekStartsOn: 1 })).padStart(2, '0');
    const weekKey = `week-${weekStart.getFullYear()}-W${weekNum}`;
    const weeklySorted = [...allUsers]
        .sort(rankComparator)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    const weekDocRef = firestore.collection('leaderboard').doc(weekKey);
    batch.set(weekDocRef, {
        category: 'weekly',
        weekStart: weekStart.toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        entryCount: Math.min(weeklySorted.length, 100),
    });
    batchOps++;
    await writeLeaderboardEntries(batch, weekDocRef.collection('entries'), weeklySorted);
    batchOps += Math.min(weeklySorted.length, 100);
    // Flush
    if (batchOps >= MAX_BATCH_OPS) {
        await batch.commit();
        batch = firestore.batch();
        batchOps = 0;
    }
    // --- Store each user's current global rank (even outside top 100) -------
    for (const user of globalSorted) {
        batch.update(firestore.collection('users').doc(user.uid), {
            currentRank: {
                global: user.rank,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            },
        });
        batchOps++;
        if (batchOps >= MAX_BATCH_OPS) {
            await batch.commit();
            batch = firestore.batch();
            batchOps = 0;
        }
    }
    // Final flush
    if (batchOps > 0) {
        await batch.commit();
    }
    // Signal clients that the leaderboard has been refreshed
    await rtdb.ref('/leaderboard_updated').set(nowMs);
    console.log(`[leaderboardCalc] Job complete — ${allUsers.length} users ranked across ` +
        `global + ${citiesMap.size} cities + weekly.`);
});
//# sourceMappingURL=leaderboardCalc.js.map