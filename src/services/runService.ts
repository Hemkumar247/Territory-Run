import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import * as turf from '@turf/turf';
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
    // Note: territoryPolygon is passed from MapScreen as [lat, lng], Turf needs [lng, lat]
    const newCoords = territoryPolygon.map(p => [p[1], p[0]]);
    const newPoly = turf.polygon([[...newCoords, newCoords[0]]]);
    
    // Fetch user's existing territories
    const territoriesQuery = query(collection(db, 'territories'), where('uid', '==', uid));
    const qs = await getDocs(territoriesQuery);
    
    let merged = false;
    
    for (const territoryDoc of qs.docs) {
      const existingTerritory = territoryDoc.data() as Territory;
      if (!existingTerritory.coordinates || existingTerritory.coordinates.length < 3) continue;
      
      const existingCoords = existingTerritory.coordinates.map(c => [c.lng, c.lat]);
      const existingPoly = turf.polygon([[...existingCoords, existingCoords[0]]]);
      
      // Check if they intersect
      const intersection = turf.intersect(turf.featureCollection([newPoly, existingPoly]));
      
      if (intersection) {
        // They overlap. We union them.
        const unioned = turf.union(turf.featureCollection([newPoly, existingPoly]));
        
        if (unioned && unioned.geometry.type === 'Polygon') {
          // Calculate new area
          const newArea = turf.area(unioned);
          // Extract coords
          const uCoords = unioned.geometry.coordinates[0];
          const storedCoords = uCoords.map(c => ({ lat: c[1], lng: c[0] }));
          
          // Strength increases up to a max (e.g., 100), plus it refreshes.
          const oldStrength = existingTerritory.strength || 0;
          const newStrength = Math.min(100, oldStrength + 20); // add 20 to strength each time, max 100
          
          const updatedTerritory: Partial<Territory> = {
            id: territoryDoc.id,
            coordinates: storedCoords as Coordinate[],
            strength: newStrength,
            lastUpdated: serverTimestamp() as any,
            areaKm2: newArea / 1000000,
          };
          
          await updateDoc(territoryDoc.ref, updatedTerritory);
          merged = true;
          break; // Stop after first merge for simplicity
        }
      }
    }
    
    if (!merged) {
      // Create a brand new disjoint territory
      const newTerritoryRef = doc(collection(db, 'territories'));
      const storedCoords = territoryPolygon.map(p => ({ lat: p[0], lng: p[1] }));
      
      const newTerritoryData: Territory = {
        uid,
        id: newTerritoryRef.id,
        coordinates: storedCoords,
        strength: 100, // Initial strength
        lastUpdated: serverTimestamp() as any,
        areaKm2: territoryArea / 1000000,
      };
      
      await setDoc(newTerritoryRef, newTerritoryData);
    }
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
