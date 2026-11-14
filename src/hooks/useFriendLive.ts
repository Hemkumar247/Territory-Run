import { useEffect, useState } from 'react';
import { LiveRunPoint, subscribeFriendLiveLocations } from '../services/liveLocationService';

export function useFriendLiveLocations(friendIds: string[]): LiveRunPoint[] {
  const [points, setPoints] = useState<LiveRunPoint[]>([]);
  const key = friendIds.filter(Boolean).slice().sort().join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    return subscribeFriendLiveLocations(ids, setPoints);
  }, [key]);

  return points;
}
