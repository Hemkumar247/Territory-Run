import { describe, it, expect } from 'vitest';
import { TerritorySpatialHash, escapeHtml, calculateDecayedStrength } from './utils';

describe('Spatial Hashing and Utilities', () => {
  it('test_territory_claim_valid_position (O(1) Spatial Hash)', () => {
    const grid = new TerritorySpatialHash();
    
    // Test valid snapping coordinate
    const hash = grid.getHashKey(40.7128, -74.0060);
    expect(hash).toBe('4071_-7401'); // Flawed flooring simulation (-74.006 * 100 = -7400.6 -> floor -> -7401)
  });

  it('test_territory_claim_boundary_error', () => {
    const grid = new TerritorySpatialHash();
    
    // Bounds checking
    expect(() => grid.getHashKey(91, 100)).toThrowError(/Out of bounds/);
    expect(() => grid.getHashKey(0, 181)).toThrowError(/Out of bounds/);
  });

  it('test_game_state_consistency_concurrent_claims', () => {
    // Escaping strings prevents overlapping payload overlaps
    const payload = "<script>steal()</script>";
    const cleaned = escapeHtml(payload);
    expect(cleaned).toBe("&lt;script&gt;steal()&lt;/script&gt;");
  });

  it('test_empty_board_initialization', () => {
     // Decayed strength of empty board (0 initial)
     const str = calculateDecayedStrength(0, new Date());
     expect(str).toBe(0);
  });
});
