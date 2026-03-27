import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Coordinate, Session, Territory } from '../types';

export async function saveRunSession(
  uid: string,
  trail: (Coordinate & { timestamp: number })[],
  distanceCovered: number,
  territoryPolygon: [number, number][] | null, // [lng, lat] format from Turf
  territoryArea: number
) {
  if (trail.length === 0) return;

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
      lastUpdated: serverTimestamp(),
      areaKm2: territoryArea / 1000000, // Convert m2 to km2
    };

    // We use setDoc to overwrite their current territory for this prototype.
    // In a full game, we might merge polygons.
    await setDoc(territoryRef, territoryData);
  }

  // 3. Update the User Profile
  const userRef = doc(db, 'users', uid);
  const userUpdates: any = {
    totalDistance: increment(distanceCovered),
    lastActive: serverTimestamp(),
  };
  
  if (territoryPolygon && territoryPolygon.length >= 3) {
    userUpdates.territoryStrength = 100; // Reset strength if new territory
  }

  await updateDoc(userRef, userUpdates);
}
