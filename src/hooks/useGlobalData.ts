import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Territory, User, Coordinate } from '../types';
import { calculateDecayedStrength } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errors';

export interface EnrichedTerritory extends Territory {
  user?: User;
}

// Helper to generate a rough polygon around a center point
function generateMockTerritory(centerLat: number, centerLng: number, radiusOffset: number): Coordinate[] {
  const coords: Coordinate[] = [];
  const points = 16; // More points for a smoother, organic shape
  
  // Generate a base radius and add some smooth noise
  const noiseOffsets = Array.from({ length: points }, () => Math.random());
  
  // Smooth the noise so the polygon doesn't have sharp jagged edges
  const smoothedOffsets = noiseOffsets.map((_, i, arr) => {
    const prev = arr[(i - 1 + points) % points];
    const next = arr[(i + 1) % points];
    const current = arr[i];
    return (prev + current * 2 + next) / 4;
  });

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Apply the smoothed noise to the radius (varying between 0.5x and 1.5x of base radius)
    const r = radiusOffset * (0.5 + smoothedOffsets[i]);
    
    // Add a tiny bit of angular jitter for even more organic feel
    const angleJitter = (Math.random() - 0.5) * 0.2;
    
    coords.push({
      lat: centerLat + Math.cos(angle + angleJitter) * r,
      lng: centerLng + Math.sin(angle + angleJitter) * r
    });
  }
  return coords;
}

export function useGlobalData() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [mockData, setMockData] = useState<{users: Record<string, User>, territories: Territory[]}>({ users: {}, territories: [] });

  // Generate mock data based on user's location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const mockUsers: Record<string, User> = {
          'mock1': {
            uid: 'mock1',
            displayName: 'NeonGhost',
            territoryColor: '#FF3CAC',
            totalDistance: 42500,
            territoryStrength: 850,
            lastActive: new Date(),
            wins: 12,
            losses: 3,
            photoURL: null
          },
          'mock2': {
            uid: 'mock2',
            displayName: 'CyberRunner',
            territoryColor: '#00E5FF',
            totalDistance: 38200,
            territoryStrength: 620,
            lastActive: new Date(),
            wins: 8,
            losses: 5,
            photoURL: null
          },
          'mock3': {
            uid: 'mock3',
            displayName: 'StreetNinja',
            territoryColor: '#FFB800',
            totalDistance: 21000,
            territoryStrength: 410,
            lastActive: new Date(),
            wins: 4,
            losses: 2,
            photoURL: null
          }
        };

        const mockTerritories: Territory[] = [
          {
            uid: 'mock1',
            coordinates: generateMockTerritory(lat + 0.002, lng + 0.002, 0.0015),
            strength: 100,
            lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago (strength ~80)
            areaKm2: 0.85
          },
          {
            uid: 'mock2',
            coordinates: generateMockTerritory(lat - 0.003, lng + 0.001, 0.0012),
            strength: 100,
            lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago (strength ~40)
            areaKm2: 0.62
          },
          {
            uid: 'mock3',
            coordinates: generateMockTerritory(lat + 0.001, lng - 0.003, 0.001),
            strength: 100,
            lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago (strength ~10)
            areaKm2: 0.41
          }
        ];

        setMockData({ users: mockUsers, territories: mockTerritories });
      }, () => {
        // Ignore errors, just don't generate mock data
      });
    }
  }, []);

  useEffect(() => {
    let usersLoaded = false;
    let territoriesLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && territoriesLoaded) {
        setLoading(false);
      }
    };

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData: Record<string, User> = {};
      snapshot.forEach((doc) => {
        usersData[doc.id] = doc.data() as User;
      });
      setUsers(usersData);
      usersLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubTerritories = onSnapshot(collection(db, 'territories'), (snapshot) => {
      const terrData: Territory[] = [];
      snapshot.forEach((doc) => {
        terrData.push(doc.data() as Territory);
      });
      setTerritories(terrData);
      territoriesLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'territories');
    });

    return () => {
      unsubUsers();
      unsubTerritories();
    };
  }, []);

  const enrichedTerritories = useMemo(() => {
    // Combine real and mock territories
    const allTerritories = [...territories];
    
    // Add mock territories only if they don't conflict with real ones (by uid)
    mockData.territories.forEach(mockTerr => {
      if (!allTerritories.find(t => t.uid === mockTerr.uid)) {
        allTerritories.push(mockTerr);
      }
    });

    const allUsers = { ...mockData.users, ...users };

    return allTerritories.map(t => ({
      ...t,
      user: allUsers[t.uid]
    }));
  }, [territories, users, mockData]);

  const leaderboardUsers = useMemo(() => {
    const allUsers = { ...mockData.users, ...users };
    
    // Calculate current decayed strength for each user based on their territories
    const userStrengths: Record<string, number> = {};
    enrichedTerritories.forEach(t => {
      const decayed = calculateDecayedStrength(t.strength || 0, t.lastUpdated);
      userStrengths[t.uid] = (userStrengths[t.uid] || 0) + decayed;
    });

    return Object.values(allUsers).map(user => ({
      ...user,
      territoryStrength: userStrengths[user.uid] || 0
    })).sort((a, b) => (b.territoryStrength || 0) - (a.territoryStrength || 0));
  }, [users, mockData, enrichedTerritories]);

  return { territories: enrichedTerritories, leaderboardUsers, loading };
}
