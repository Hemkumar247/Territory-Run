import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import * as turf from '@turf/turf';
import { Coordinate, Session, Territory, User } from '../types';
import { checkAchievements } from '../lib/achievements';
import { calculateNextStreak } from '../lib/streak';
import { handleFirestoreError, OperationType } from '../lib/errors';
import { queueRunForSync, syncQueuedRuns, isOnline } from '../lib/offlineQueue';

/**
 * Persists a completed run session to the Firestore database.
 * Computes polygon state updates and unlocks relevant achievements asynchronously.
 * 
 * @param userProfile - The active user's profile object
 * @param trail - List of coordinates collected during the run
 * @param distanceCovered - Total run path in meters
 * @param territoryPolygon - Bounding coordinate array formatting a turf polygon 
 * @param territoryArea - Area enclosed by the polygon in square meters
 * @returns Array of new achievement string IDs unlocked by the run 
 * @throws FirestoreError on failing transaction states
 */
async function performSaveRunSession(
  userProfile: User,
  trail: (Coordinate & { timestamp: number })[],
  distanceCovered: number,
  territoryPolygon: [number, number][] | null,
  territoryArea: number
): Promise<string[]> {
  const uid = userProfile.uid;
  const startTime = new Date(trail[0].timestamp);
  const endTime = new Date(trail[trail.length - 1].timestamp);

  // Firestore rules cap a stored trail at 5000 points; thin very long runs (distance/territory use the full trail).
  const MAX_TRAIL_POINTS = 2000;
  const step = Math.ceil(trail.length / MAX_TRAIL_POINTS);
  const storedTrail = step > 1 ? trail.filter((_, i) => i % step === 0 || i === trail.length - 1) : trail;

  // 1. Save the Session
  const sessionRef = doc(collection(db, 'sessions'));
  const sessionData: Session = {
    uid,
    startTime,
    endTime,
    distanceCovered,
    coordinatesTrail: storedTrail,
    territoryGained: territoryArea,
    territoryLost: 0,
  };
  await setDoc(sessionRef, sessionData);

  // 2. Update the User's Territory if they formed a polygon
  if (territoryPolygon && territoryPolygon.length >= 3) {
    const newCoords = territoryPolygon.map(p => [p[1], p[0]]);
    const newPoly = turf.polygon([[...newCoords, newCoords[0]]]);
    
    const territoriesQuery = query(collection(db, 'territories'), where('uid', '==', uid));
    const qs = await getDocs(territoriesQuery);
    
    let merged = false;
    
    for (const territoryDoc of qs.docs) {
      const existingTerritory = territoryDoc.data() as Territory;
      if (!existingTerritory.coordinates || existingTerritory.coordinates.length < 3) continue;
      
      const existingCoords = existingTerritory.coordinates.map(c => [c.lng, c.lat]);
      const existingPoly = turf.polygon([[...existingCoords, existingCoords[0]]]);
      
      const intersection = turf.intersect(turf.featureCollection([newPoly, existingPoly]));
      
      if (intersection) {
        const unioned = turf.union(turf.featureCollection([newPoly, existingPoly]));
        
        if (unioned && unioned.geometry.type === 'Polygon') {
          const newArea = turf.area(unioned);
          const uCoords = unioned.geometry.coordinates[0];
          const storedCoords = uCoords.map(c => ({ lat: c[1], lng: c[0] }));
          
          const oldStrength = existingTerritory.strength || 0;
          const newStrength = Math.min(100, oldStrength + 20);
          
          const updatedTerritory: Partial<Territory> = {
            id: territoryDoc.id,
            coordinates: storedCoords as Coordinate[],
            strength: newStrength,
            lastUpdated: serverTimestamp() as any,
            areaKm2: newArea / 1000000,
          };
          
          await updateDoc(territoryDoc.ref, updatedTerritory);
          merged = true;
          break;
        }
      }
    }
    
    if (!merged) {
      const newTerritoryRef = doc(collection(db, 'territories'));
      const storedCoords = territoryPolygon.map(p => ({ lat: p[0], lng: p[1] }));
      
      const newTerritoryData: Territory = {
        uid,
        id: newTerritoryRef.id,
        coordinates: storedCoords,
        strength: 100,
        lastUpdated: serverTimestamp() as any,
        areaKm2: territoryArea / 1000000,
      };
      
      await setDoc(newTerritoryRef, newTerritoryData);
    }
  }

  // 3. Calculate updated daily active streak
  const streakUpdate = calculateNextStreak(userProfile, endTime);

  // 4. Check for new achievements
  const newAchievements = checkAchievements(userProfile, {
    distanceCovered,
    territoryGained: territoryArea,
    nextStreak: streakUpdate.currentStreak,
  });

  // 5. Update the User Profile
  const userRef = doc(db, 'users', uid);
  const userUpdates: Record<string, unknown> = {
    totalDistance: increment(distanceCovered),
    totalRuns: increment(1),
    lastActive: serverTimestamp(),
    currentStreak: streakUpdate.currentStreak,
    longestStreak: streakUpdate.longestStreak,
    lastRunDate: streakUpdate.lastRunDate,
  };
  
  if (territoryPolygon && territoryPolygon.length >= 3) {
    userUpdates.territoryStrength = 100;
  }

  if (newAchievements.length > 0) {
    userUpdates.achievements = arrayUnion(...newAchievements);
  }

  try {
    await updateDoc(userRef, userUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
  
  return newAchievements;
}

export async function saveRunSession(
  userProfile: User,
  trail: (Coordinate & { timestamp: number })[],
  distanceCovered: number,
  territoryPolygon: [number, number][] | null,
  territoryArea: number
): Promise<string[] | undefined> {
  if (trail.length === 0) return;

  // If online, try to save directly
  if (isOnline()) {
    try {
      return await performSaveRunSession(userProfile, trail, distanceCovered, territoryPolygon, territoryArea);
    } catch (error) {
      // Fall through to queue for later
      console.warn('Online save failed, queuing for later:', error);
    }
  }

  // Queue for later sync (offline or failed)
  await queueRunForSync(userProfile.uid, {
    trail,
    distanceMeters: distanceCovered,
    territoryPolygon: territoryPolygon || [],
    territoryArea,
  });
  
  return [];
}

export async function syncPendingRuns(userId: string): Promise<{ synced: number; failed: number }> {
  return syncQueuedRuns(userId, async (data) => {
    // Use the real profile: streak and achievements are computed from it.
    const snap = await getDoc(doc(db, 'users', userId));
    const profile = snap.exists() ? ({ ...snap.data(), uid: userId } as User) : ({ uid: userId } as User);
    await performSaveRunSession(
      profile,
      data.trail,
      data.distanceMeters,
      data.territoryPolygon as [number, number][],
      data.territoryArea
    );
  });
}
