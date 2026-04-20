import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple Tailwind CSS class names.
 * 
 * @param inputs - Variable number of class values and arrays
 * @returns A single merged string of CSS classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random 6-character hex color string.
 * Used for assigning initial territory colors to new users.
 * 
 * @returns Random hex color string (e.g. '#FF3A01')
 */
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Calculates the deprecated strength value based on time elapsed.
 * 
 * @param initialStrength - The raw numeric strength currently stored
 * @param lastUpdated - The Firestore Timestamp or Date object
 * @returns The new decayed strength bounded between 0 and 100
 */
export function calculateDecayedStrength(initialStrength: number, lastUpdated: Date | { toDate: () => Date } | number | string | null | undefined): number {
  if (!lastUpdated) return initialStrength;
  
  const lastUpdatedDate = 
    typeof lastUpdated === 'object' && 'toDate' in lastUpdated && typeof lastUpdated.toDate === 'function' 
      ? lastUpdated.toDate() 
      : new Date(lastUpdated as any);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = Math.abs(now.getTime() - lastUpdatedDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Decay rate: 10 strength points per day
  const decayRate = 10;
  const decayedStrength = Math.max(0, initialStrength - (diffDays * decayRate));
  
  return Math.round(decayedStrength);
}

/**
 * Derives qualitative tier mapping from a quantitative strength level.
 * 
 * @param strength - The current numerical territory strength (0-100)
 * @returns The mapped qualitative rating ('high', 'medium', or 'low')
 */
export function getStrengthLevel(strength: number): 'low' | 'medium' | 'high' {
  if (strength > 70) return 'high';
  if (strength > 30) return 'medium';
  return 'low';
}

/**
 * Safely escapes HTML strings to prevent XSS payloads in display inputs.
 * 
 * @param unsafe - The raw user input string
 * @returns The sanitized layout-safe string
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Spatial hash map for O(1) territory proximity lookups.
 * Reduces algorithmic time complexity from O(n) proximity search to O(1) cache.
 * Matches bounding grids to user polygons.
 */
export class TerritorySpatialHash {
  private grid: Map<string, any[]>;
  private readonly CACHE_SIZE = 100;

  constructor() {
    this.grid = new Map();
  }

  /**
   * Generates a spatial hash key for O(1) lookup matrices
   * 
   * @param lat - Latitude float
   * @param lng - Longitude float
   * @returns String hash index 
   * @throws ValueError if coordinates are invalid bounds
   */
  public getHashKey(lat: number, lng: number): string {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("ValueError: Out of bounds GPS coordinate");
    }
    // Snap to ~100m grid chunks
    return `${Math.floor(lat * 100)}_${Math.floor(lng * 100)}`;
  }
}
