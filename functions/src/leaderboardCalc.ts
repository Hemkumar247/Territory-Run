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

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getWeek, startOfWeek } from 'date-fns';
import { initSentry, captureException } from './sentry';

initSentry();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserRankEntry {
  uid: string;
  displayName: string;
  territoryColor: string;
  areaKm2: number;
  territoryStrength: number;
  wins: number;
  city?: string;
  rank?: number;
}

// ---------------------------------------------------------------------------
// Ranking comparator
// ---------------------------------------------------------------------------

/** Primary: area ↓, Secondary: strength ↓, Tiebreaker: wins ↓ */
function rankComparator(a: UserRankEntry, b: UserRankEntry): number {
  if (b.areaKm2 !== a.areaKm2) return b.areaKm2 - a.areaKm2;
  if (b.territoryStrength !== a.territoryStrength) return b.territoryStrength - a.territoryStrength;
  return b.wins - a.wins;
}

// ---------------------------------------------------------------------------
// Helper: write up to 100 ranked entries into a Firestore sub-collection
// ---------------------------------------------------------------------------

const MAX_BATCH_OPS = 499;

async function writeLeaderboardEntries(
  batch: admin.firestore.WriteBatch,
  entriesRef: admin.firestore.CollectionReference,
  ranked: UserRankEntry[],
): Promise<void> {
  for (const entry of ranked.slice(0, 100)) {
    batch.set(entriesRef.doc(entry.uid), entry);
  }
}

// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------

export const calculateLeaderboard = onSchedule(
  {
    schedule: 'every 15 minutes',
    region: 'us-central1',
    timeoutSeconds: 540,
  },
  async () => {
    const firestore = admin.firestore();
    const rtdb = admin.database();
    const nowMs = Date.now();

    console.log('[leaderboardCalc] Job started at', new Date(nowMs).toISOString());

    // Fetch user profiles and territory metadata in parallel
    let usersSnap: admin.firestore.QuerySnapshot;
    let territoriesSnap: admin.firestore.QuerySnapshot;

    try {
      [usersSnap, territoriesSnap] = await Promise.all([
        firestore.collection('users').get(),
        firestore.collection('territories').get(),
      ]);
    } catch (err) {
      await captureException(err);
      throw err;
    }

    // Build a uid → areaKm2 lookup from territories
    const territoryAreaMap = new Map<string, number>();
    for (const doc of territoriesSnap.docs) {
      territoryAreaMap.set(doc.id, (doc.data()['areaKm2'] as number) ?? 0);
    }

    // Build a flat array of all users with their ranking data
    const allUsers: UserRankEntry[] = usersSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        displayName: (d['displayName'] as string) ?? 'Unknown',
        territoryColor: (d['territoryColor'] as string) ?? '#888888',
        areaKm2: territoryAreaMap.get(doc.id) ?? 0,
        territoryStrength: (d['territoryStrength'] as number) ?? 0,
        wins: (d['wins'] as number) ?? 0,
        city: d['city'] as string | undefined,
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
    const citiesMap = new Map<string, UserRankEntry[]>();
    for (const user of allUsers) {
      if (user.city) {
        if (!citiesMap.has(user.city)) citiesMap.set(user.city, []);
        citiesMap.get(user.city)!.push(user);
      }
    }

    for (const [city, cityUsers] of citiesMap.entries()) {
      const slug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slug) continue;

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
    const weekStart = startOfWeek(new Date(nowMs), { weekStartsOn: 1 }); // Monday
    const weekNum = String(getWeek(weekStart, { weekStartsOn: 1 })).padStart(2, '0');
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

    console.log(
      `[leaderboardCalc] Job complete — ${allUsers.length} users ranked across ` +
      `global + ${citiesMap.size} cities + weekly.`,
    );
  },
);
