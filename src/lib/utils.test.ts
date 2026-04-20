import { describe, it, expect } from 'vitest';
import { calculateDecayedStrength, getStrengthLevel, escapeHtml, generateRandomColor } from './utils';

describe('Utility Functions - Core Logic', () => {
  it('calculates decayed strength correctly based on time elapsed', () => {
    const originalStrength = 100;
    // Simulate 5 days passing (432000000 ms) to avoid dropping to 0 completely
    const fiveDaysAgo = Date.now() - 432000000;
    
    const decayed = calculateDecayedStrength(originalStrength, fiveDaysAgo);
    
    // After 5 days at 10 strength points/day, it should be 50
    expect(decayed).toBeLessThan(100);
    expect(decayed).toBeGreaterThan(0);
    expect(decayed).toBe(50);
  });

  it('maintains full strength for immediate checks', () => {
    const strength = calculateDecayedStrength(100, Date.now());
    expect(strength).toBe(100);
    expect(calculateDecayedStrength(100, null)).toBe(100);
  });

  it('calculates decayed strength handling firestore toDate correctly', () => {
    const originalStrength = 100;
    const fakeFirestoreTimestamp = {
      toDate: () => new Date(Date.now() - 432000000)
    };
    const decayed = calculateDecayedStrength(originalStrength, fakeFirestoreTimestamp);
    expect(decayed).toBe(50);
  });

  it('calculates decayed strength using raw Date object correctly', () => {
    const originalStrength = 100;
    const rawDate = new Date(Date.now() - 432000000);
    const decayed = calculateDecayedStrength(originalStrength, rawDate);
    expect(decayed).toBe(50);
  });

  it('calculates decayed strength using string date correctly', () => {
    const originalStrength = 100;
    const stringDate = new Date(Date.now() - 432000000).toISOString();
    const decayed = calculateDecayedStrength(originalStrength, stringDate);
    expect(decayed).toBe(50);
  });

  it('calculates decayed strength using number date correctly', () => {
    const originalStrength = 100;
    const numberDate = Date.now() - 432000000;
    const decayed = calculateDecayedStrength(originalStrength, numberDate);
    expect(decayed).toBe(50);
  });

  it('correctly maps strength values to qualitative levels', () => {
    expect(getStrengthLevel(95)).toBe('high');
    expect(getStrengthLevel(50)).toBe('medium');
    expect(getStrengthLevel(10)).toBe('low');
  });

  it('escapes HTML strings to prevent XSS (Security)', () => {
    const maliciousInput = '<script>alert("hack")\'&</script>';
    const safeOutput = escapeHtml(maliciousInput);
    
    expect(safeOutput).not.toContain('<script>');
    expect(safeOutput).toContain('&lt;script&gt;');
    expect(safeOutput).toContain('&amp;');
    expect(safeOutput).toContain('&#039;');
  });

  it('generates a random hex color string', () => {
    const color = generateRandomColor();
    expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });
});
