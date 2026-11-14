import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Territory, User } from '../types';
import { calculateDecayedStrength } from '../lib/utils';

export interface EnrichedTerritory extends Territory {
  user?: User;
}

export function useGlobalData() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

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
      console.error('users listener:', error.code);
      setLoading(false);
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
      console.error('territories listener:', error.code);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubTerritories();
    };
  }, []);

  const enrichedTerritories = useMemo(() => {
    const allUsers = users;
    const allTerritories = territories;

    return allTerritories
      .map(t => ({
        ...t,
        user: allUsers[t.uid]
      }))
      .filter(t => calculateDecayedStrength(t.strength || 0, t.lastUpdated) > 0);
  }, [territories, users]);

  const leaderboardUsers = useMemo(() => {
    const allUsers = users;

    // Calculate current decayed strength for each user based on their territories
    const userStrengths: Record<string, number> = {};
    enrichedTerritories.forEach(t => {
      const decayed = calculateDecayedStrength(t.strength || 0, t.lastUpdated);
      userStrengths[t.uid] = (userStrengths[t.uid] || 0) + decayed;
    });

    return Object.values(allUsers)
      .map(user => ({
        ...user,
        territoryStrength: userStrengths[user.uid] || 0
      }))
      .filter(user => (user.territoryStrength || 0) > 0)
      .sort((a, b) => (b.territoryStrength || 0) - (a.territoryStrength || 0));
  }, [users, enrichedTerritories]);

  return { territories: enrichedTerritories, leaderboardUsers, loading };
}
