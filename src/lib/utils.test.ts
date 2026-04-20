import { describe, it, expect } from 'vitest';
import { calculateDecayedStrength, getStrengthLevel, escapeHtml } from './utils';

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
  });

  it('correctly maps strength values to qualitative levels', () => {
    expect(getStrengthLevel(95)).toBe('high');
    expect(getStrengthLevel(50)).toBe('medium');
    expect(getStrengthLevel(10)).toBe('low');
  });

  it('escapes HTML strings to prevent XSS (Security)', () => {
    const maliciousInput = '<script>alert("hack")</script>';
    const safeOutput = escapeHtml(maliciousInput);
    
    expect(safeOutput).not.toContain('<script>');
    expect(safeOutput).toContain('&lt;script&gt;');
  });
});
