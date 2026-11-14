import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OFFLINE = 'Tactician AI (Offline): Expand your perimeter.';
const EMPTY_TEXT = 'Tactician AI: Perimeter is exposed. Run a defensive loop today.';

type ApiResponse = {
  status: (code: number) => { json: (body: unknown) => void };
};

export function cannedAdvice(distanceTotal: number): string {
  return distanceTotal > 10
    ? "Tactician AI: You've secured over 10km of territory. Focus on consolidating your outer borders today."
    : 'Tactician AI: Your territory is small. Establish a perimeter by running a 2km loop around your base.';
}

export function readAdviceInput(body: unknown): { distanceTotal: number; recentRuns: number } | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as { distanceTotal?: unknown; recentRuns?: unknown };
  const distanceTotal = Number(record.distanceTotal);
  const recentRuns = Number(record.recentRuns);
  if (!Number.isFinite(distanceTotal) || !Number.isFinite(recentRuns)) return null;
  if (distanceTotal < 0 || distanceTotal > 100000) return null;
  if (recentRuns < 0 || recentRuns > 1_000_000) return null;
  return { distanceTotal, recentRuns };
}

function firebaseWebApiKey(): string {
  const candidates = [
    join(process.cwd(), 'firebase-applet-config.json'),
    join(process.cwd(), '..', 'firebase-applet-config.json'),
  ];
  for (const configPath of candidates) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8')) as { apiKey?: string };
      if (config.apiKey) return config.apiKey;
    } catch {
      // Try the next location. The Vercel function includes this file beside the project root.
    }
  }
  return '';
}

export async function isProjectUser(idToken: string): Promise<boolean> {
  if (!idToken) return false;
  const apiKey = firebaseWebApiKey();
  if (!apiKey) return false;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!response.ok) return false;
  const data = (await response.json()) as { users?: unknown[] };
  return Array.isArray(data.users) && data.users.length > 0;
}

export async function createTacticalAdvice(
  distanceTotal: number,
  recentRuns: number,
  apiKey: string
): Promise<string> {
  if (!apiKey) return cannedAdvice(distanceTotal);

  try {
    const prompt = `You are "Aura", a tactical AI assistant in a GPS territory-control running game.
The player has run a total of ${distanceTotal.toFixed(1)}km across ${recentRuns} runs.
Provide a 2-sentence logical, strategic advice on what kind of run they should do next to maximize their territory control.
Be immersive, use military-tactical but fitness-friendly language.`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!response.ok) return OFFLINE;
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    return text || EMPTY_TEXT;
  } catch {
    return OFFLINE;
  }
}

function bearerToken(header: unknown): string {
  if (typeof header !== 'string') return '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Coach failed';
  return message.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[key]');
}

export default async function handler(
  req: { method?: string; body?: unknown; headers?: { authorization?: unknown } },
  res: ApiResponse
) {
  try {
    if (req.method === 'GET') {
      res.status(process.env.GEMINI_API_KEY ? 200 : 503).json({
        configured: Boolean(process.env.GEMINI_API_KEY),
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body) as unknown;
      } catch {
        body = null;
      }
    }
    const input = readAdviceInput(body);
    if (!input) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const idToken = bearerToken(req.headers?.authorization);
    const allowed = await isProjectUser(idToken);
    if (!allowed) {
      res.status(401).json({ error: 'Sign in required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const advice = await createTacticalAdvice(input.distanceTotal, input.recentRuns, apiKey);
    res.status(200).json({ advice });
  } catch (error) {
    console.error('tactician', safeMessage(error));
    res.status(200).json({ advice: OFFLINE });
  }
}
