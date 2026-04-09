import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function calculateDecayedStrength(initialStrength: number, lastUpdated: any): number {
  if (!lastUpdated) return initialStrength;
  
  const lastUpdatedDate = lastUpdated.toDate ? lastUpdated.toDate() : new Date(lastUpdated);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = Math.abs(now.getTime() - lastUpdatedDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Decay rate: 10 strength points per day
  const decayRate = 10;
  const decayedStrength = Math.max(0, initialStrength - (diffDays * decayRate));
  
  return Math.round(decayedStrength);
}

export function getStrengthLevel(strength: number): 'low' | 'medium' | 'high' {
  if (strength > 70) return 'high';
  if (strength > 30) return 'medium';
  return 'low';
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
