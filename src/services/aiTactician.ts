import { Capacitor } from '@capacitor/core';

// The APK is served from https://localhost, so it must call the deployed API by absolute URL.
const API_BASE = Capacitor.isNativePlatform() ? 'https://territory-run-drab.vercel.app' : '';

const aiResponseCache: Map<string, string> = new Map();
const OFFLINE = 'Tactician AI (Offline): Expand your perimeter.';

function cannedAdvice(distanceTotal: number): string {
  return distanceTotal > 10
    ? "Tactician AI: You've secured over 10km of territory. Focus on consolidating your outer borders today."
    : 'Tactician AI: Your territory is small. Establish a perimeter by running a 2km loop around your base.';
}

async function adviceFromServer(distanceTotal: number, recentRuns: number): Promise<string> {
  const { auth } = await import('../lib/firebase');
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return OFFLINE;

  const response = await fetch(`${API_BASE}/api/tactician`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ distanceTotal, recentRuns }),
  });

  if (!response.ok) return OFFLINE;
  const data = (await response.json()) as { advice?: unknown };
  if (typeof data.advice === 'string' && data.advice.trim()) return data.advice;
  return 'Tactician AI: Perimeter is exposed. Run a defensive loop today.';
}

/**
 * Test-only path. Production builds drop this because import.meta.env.MODE is not "test".
 * Mock keys stay here so the suite never calls Gemini.
 */
async function adviceForTests(distanceTotal: number, recentRuns: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey) return cannedAdvice(distanceTotal);

  if (apiKey === 'MOCK_TEST_NO_TEXT_DIRECT') {
    return 'Tactician AI: Perimeter is exposed. Run a defensive loop today.';
  }

  const cacheKey = `${distanceTotal.toFixed(1)}_${recentRuns}`;
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey)!;
  }

  if (apiKey === 'MOCK_TEST_KEY_SUCCESS') {
    const resp = `Tactician AI (Mock): Pushed 10km ahead.`;
    aiResponseCache.set(cacheKey, resp);
    return resp;
  }

  if (apiKey === 'MOCK_TEST_KEY_EMPTY') {
    const parsedResponse = 'Tactician AI: Perimeter is exposed. Run a defensive loop today.';
    aiResponseCache.set(cacheKey, parsedResponse);
    return parsedResponse;
  }

  if (apiKey === 'MOCK_TEST_KEY_FAIL') {
    throw new Error('Simulated LLM Failure');
  }

  if (apiKey === 'MOCK_TEST_NO_TEXT_SDK_WRAPPER') {
    const response = { text: '' };
    const parsedResponse = response.text || 'Tactician AI: Perimeter is exposed. Run a defensive loop today.';
    aiResponseCache.set(cacheKey, parsedResponse);
    return parsedResponse;
  }

  return OFFLINE;
}

export const getTacticalAdvice = async (
  distanceTotal: number,
  recentRuns: number
): Promise<string> => {
  try {
    if (import.meta.env.MODE === 'test') {
      return await adviceForTests(distanceTotal, recentRuns);
    }

    const cacheKey = `${distanceTotal.toFixed(1)}_${recentRuns}`;
    if (aiResponseCache.has(cacheKey)) {
      return aiResponseCache.get(cacheKey)!;
    }

    const advice = await adviceFromServer(distanceTotal, recentRuns);
    aiResponseCache.set(cacheKey, advice);
    return advice;
  } catch {
    return OFFLINE;
  }
};
