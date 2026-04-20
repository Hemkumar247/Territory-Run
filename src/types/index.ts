export interface User {
  uid: string;
  displayName: string;
  territoryColor: string;
  totalDistance: number;
  territoryStrength: number;
  lastActive: Date | { toDate: () => Date } | number | string | null | undefined; // Firestore Timestamp
  wins: number;
  losses: number;
  photoURL?: string | null;
  totalRuns?: number;
  friendCode?: string;
  friends?: string[];
  friendRequests?: string[];
  preferences?: {
    units: 'metric' | 'imperial';
    notifications: boolean;
    publicProfile: boolean;
  };
  achievements?: string[];
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Territory {
  uid: string;
  coordinates: Coordinate[];
  strength: number;
  lastUpdated: Date | { toDate: () => Date } | number | string | null | undefined; // Firestore Timestamp
  areaKm2: number;
  user?: User;
}

export interface Session {
  uid: string;
  startTime: Date | { toDate: () => Date } | number | string | null | undefined; // Firestore Timestamp
  endTime: Date | { toDate: () => Date } | number | string | null | undefined; // Firestore Timestamp
  distanceCovered: number;
  coordinatesTrail: (Coordinate & { timestamp: number })[];
  territoryGained: number;
  territoryLost: number;
}
