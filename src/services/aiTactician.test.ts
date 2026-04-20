import { describe, it, expect, vi } from 'vitest';
import { getTacticalAdvice } from './aiTactician';

describe('AI Tactician Persona Logic', () => {
  it('test_fallback_no_api_key_small_territory', async () => {
    // Modify env to ensure no API key
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubGlobal('import', { meta: { env: { VITE_GEMINI_API_KEY: '' } } });

    const advice = await getTacticalAdvice(5.5, 3);
    
    expect(advice).toContain("Tactician AI: Your territory is small.");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('test_fallback_no_api_key_large_territory', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubGlobal('import', { meta: { env: { VITE_GEMINI_API_KEY: '' } } });

    const advice = await getTacticalAdvice(15.0, 3);
    
    expect(advice).toContain("Tactician AI: You've secured over 10km");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('test_ai_pathfinding_efficiency_caching', async () => {
    // We inject MOCK_TEST_KEY_SUCCESS to mock API response and test caching
    vi.stubEnv('GEMINI_API_KEY', 'MOCK_TEST_KEY_SUCCESS');
    vi.stubGlobal('import', { meta: { env: { VITE_GEMINI_API_KEY: 'MOCK_TEST_KEY_SUCCESS' } } });

    const advice1 = await getTacticalAdvice(99.9, 1);
    const advice2 = await getTacticalAdvice(99.9, 1); // This should hit cache branch directly
    
    expect(advice1).toBe('Tactician AI (Mock): Pushed 10km ahead.');
    expect(advice2).toBe('Tactician AI (Mock): Pushed 10km ahead.');
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('test_ai_fallback_empty_response', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'MOCK_TEST_KEY_EMPTY');
    vi.stubGlobal('import', { meta: { env: { VITE_GEMINI_API_KEY: 'MOCK_TEST_KEY_EMPTY' } } });

    const advice = await getTacticalAdvice(99.9, 2); // Different arguments to bypass cache
    expect(advice).toBe('Tactician AI: Perimeter is exposed. Run a defensive loop today.');

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('test_ai_error_handling', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'MOCK_TEST_KEY_FAIL');
    vi.stubGlobal('import', { meta: { env: { VITE_GEMINI_API_KEY: 'MOCK_TEST_KEY_FAIL' } } });

    // Should throw or catch due to fake key failing hitting actual endpoints or explicitly
    const advice = await getTacticalAdvice(99.9, 3); 
    expect(advice).toBe('Tactician AI (Offline): Expand your perimeter.');

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('test_ai_generative_call_no_text', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'MOCK_TEST_NO_TEXT_SDK_WRAPPER');
    vi.stubGlobal('import', { meta: { env: { VITE_GEMINI_API_KEY: 'MOCK_TEST_NO_TEXT_SDK_WRAPPER' } } });

    const advice = await getTacticalAdvice(500, 500); 
    expect(advice).toContain('Tactician AI: Perimeter is exposed. Run a defensive loop today.');

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});


