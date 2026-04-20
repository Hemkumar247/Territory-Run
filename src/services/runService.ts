import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Coordinate, Session, Territory, User } from '../types';
import { checkAchievements } from '../lib/achievements';

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
export async function saveRunSession(
  userProfile: User,
  trail: (Coordinate & { timestamp: number })[],
  distanceCovered: number,
  territoryPolygon: [number, number][] | null, // [lng, lat] format from Turf
  territoryArea: number
): Promise<string[] | undefined> {
  if (trail.length === 0) return;

  const uid = userProfile.uid;
  const startTime = new Date(trail[0].timestamp);
  const endTime = new Date(trail[trail.length - 1].timestamp);

  // 1. Save the Session
  const sessionRef = doc(collection(db, 'sessions'));
  const sessionData: Session = {
    uid,
    startTime,
    endTime,
    distanceCovered,
    coordinatesTrail: trail,
    territoryGained: territoryArea,
    territoryLost: 0, // Placeholder for future logic
  };
  await setDoc(sessionRef, sessionData);

  // 2. Update the User's Territory if they formed a polygon
  if (territoryPolygon && territoryPolygon.length >= 3) {
    const territoryRef = doc(db, 'territories', uid);
    
    // Convert [lng, lat] back to {lat, lng} for storage
    const coordinates = territoryPolygon.map(p => ({ lat: p[1], lng: p[0] }));
    
    const territoryData: Territory = {
      uid,
      coordinates,
      strength: 100, // Initial strength
      lastUpdated: serverTimestamp() as any,
      areaKm2: territoryArea / 1000000, // Convert m2 to km2
    };

    // We use setDoc to overwrite their current territory for this prototype.
    // In a full game, we might merge polygons.
    await setDoc(territoryRef, territoryData);
  }

  // 3. Check for new achievements
  const newAchievements = checkAchievements(userProfile, {
    distanceCovered,
    territoryGained: territoryArea
  });

  // 4. Update the User Profile
  const userRef = doc(db, 'users', uid);
  const userUpdates: Record<string, unknown> = {
    totalDistance: increment(distanceCovered),
    totalRuns: increment(1),
    lastActive: serverTimestamp(),
  };
  
  if (territoryPolygon && territoryPolygon.length >= 3) {
    userUpdates.territoryStrength = 100; // Reset strength if new territory
  }

  if (newAchievements.length > 0) {
    userUpdates.achievements = arrayUnion(...newAchievements);
  }

  await updateDoc(userRef, userUpdates);
  
  return newAchievements;
}
