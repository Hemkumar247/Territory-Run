export function getUserRank(distanceMeters: number) {
  const km = distanceMeters / 1000;
  
  if (km < 5) return { level: 1, title: 'Novice Scout', nextAt: 5 };
  if (km < 20) return { level: 2, title: 'Explorer', nextAt: 20 };
  if (km < 50) return { level: 3, title: 'Pathfinder', nextAt: 50 };
  if (km < 100) return { level: 4, title: 'Conqueror', nextAt: 100 };
  if (km < 500) return { level: 5, title: 'Grandmaster', nextAt: 500 };
  
  return { level: 6, title: 'Legend', nextAt: null };
}
