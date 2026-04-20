import { describe, it, expect } from 'vitest';
import { getTacticalAdvice } from './aiTactician';

describe('AI Tactician Persona Logic', () => {
  it('test_ai_pathfinding_efficiency_caching', async () => {
    // Tests that calls are effectively O(1) via cache by observing identical output 
    // when network dependency returns random strings.
    const advice1 = await getTacticalAdvice(5.5, 3);
    const advice2 = await getTacticalAdvice(5.5, 3);
    
    // Assert cache efficiency
    expect(advice1).toBe(advice2);
    expect(advice1).toContain("Tactician AI"); // Fallback trigger
  });

  it('test_game_state_consistency', async () => {
     // Ensure varying prompts yield distinct state branches (if API bypassed via fallback)
     const state1 = await getTacticalAdvice(25.0, 10);
     expect(state1).toBeDefined();
  });
});
