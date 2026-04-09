export interface User {
  uid: string;
  displayName: string;
  email: string;
  territoryColor: string;
  totalDistance: number;
  territoryStrength: number;
  lastActive: any; // Firestore Timestamp
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
  lastUpdated: any; // Firestore Timestamp
  areaKm2: number;
}

export interface Session {
  uid: string;
  startTime: any; // Firestore Timestamp
  endTime: any; // Firestore Timestamp
  distanceCovered: number;
  coordinatesTrail: (Coordinate & { timestamp: number })[];
  territoryGained: number;
  territoryLost: number;
}
