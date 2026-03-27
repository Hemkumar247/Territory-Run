import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Territory, User } from '../types';

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
    });

    const unsubTerritories = onSnapshot(collection(db, 'territories'), (snapshot) => {
      const terrData: Territory[] = [];
      snapshot.forEach((doc) => {
        terrData.push(doc.data() as Territory);
      });
      setTerritories(terrData);
      territoriesLoaded = true;
      checkLoading();
    });

    return () => {
      unsubUsers();
      unsubTerritories();
    };
  }, []);

  const enrichedTerritories = useMemo(() => {
    return territories.map(t => ({
      ...t,
      user: users[t.uid]
    }));
  }, [territories, users]);

  const leaderboardUsers = useMemo(() => {
    return Object.values(users).sort((a, b) => b.totalDistance - a.totalDistance);
  }, [users]);

  return { territories: enrichedTerritories, leaderboardUsers, loading };
}
