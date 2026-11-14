import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OFFLINE = 'Tactician AI (Offline): Expand your perimeter.';
const EMPTY_TEXT = 'Tactician AI: Perimeter is exposed. Run a defensive loop today.';

type ApiResponse = {
  status: (code: number) => { json: (body: unknown) => void; end: () => void };
  setHeader: (name: string, value: string) => void;
};

// Browser origin of the deployed site plus the Capacitor WebView origins used by the Android/iOS apps.
const ALLOWED_ORIGINS = new Set([
  'https://territory-run-drab.vercel.app',
  'https://territory-run-hems-projects-0790fffd.vercel.app',
  'https://localhost',
  'capacitor://localhost',
]);

const RATE_LIMIT = 10; // requests per uid per minute
const hits = new Map<string, number[]>(); // ponytail: per-instance memory, use Redis/KV if you scale out

export function rateLimited(uid: string, now = Date.now()): boolean {
  const recent = (hits.get(uid) || []).filter((t) => now - t < 60_000);
  if (recent.length >= RATE_LIMIT) {
    hits.set(uid, recent);
    return true;
  }
  recent.push(now);
  hits.set(uid, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

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

export async function projectUserId(idToken: string): Promise<string> {
  if (!idToken) return '';
  const apiKey = firebaseWebApiKey();
  if (!apiKey) return '';
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!response.ok) return '';
  const data = (await response.json()) as { users?: Array<{ localId?: string; disabled?: boolean }> };
  const user = data.users?.[0];
  return user?.localId && !user.disabled ? user.localId : '';
}

export async function isProjectUser(idToken: string): Promise<boolean> {
  return Boolean(await projectUserId(idToken));
}

function buildPrompt(distanceTotal: number, recentRuns: number): string {
  return `You are "Aura", a tactical AI assistant in a GPS territory-control running game.
The player has run a total of ${distanceTotal.toFixed(1)}km across ${recentRuns} runs.
Provide a 2-sentence logical, strategic advice on what kind of run they should do next to maximize their territory control.
Be immersive, use military-tactical but fitness-friendly language.`;
}

/** Returns the model's text, or '' on any failure (timeout, quota/429, 5xx, empty answer) so the caller can fall back. */
async function askGemini(prompt: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(7000),
      }
    );
    if (!response.ok) return '';
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
  } catch {
    return '';
  }
}

/** NVIDIA NIM (OpenAI-compatible). Model is configurable via NVIDIA_MODEL, default GLM-4.7. */
async function askNvidia(prompt: string, apiKey: string, model: string): Promise<string> {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
        chat_template_kwargs: { enable_thinking: false }, // short answer, skip slow reasoning
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return '';
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
    const raw = data.choices?.[0]?.message?.content || '';
    return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch {
    return '';
  }
}

export async function createTacticalAdvice(
  distanceTotal: number,
  recentRuns: number,
  geminiKey: string,
  nvidia: { apiKey?: string; model?: string } = {}
): Promise<string> {
  if (!geminiKey && !nvidia.apiKey) return cannedAdvice(distanceTotal);

  const prompt = buildPrompt(distanceTotal, recentRuns);
  // Primary: Gemini. Fallback: NVIDIA (when Gemini is overloaded, rate-limited, down, or returns nothing).
  const text =
    (geminiKey && (await askGemini(prompt, geminiKey))) ||
    (nvidia.apiKey && (await askNvidia(prompt, nvidia.apiKey, nvidia.model || 'z-ai/glm-4.7'))) ||
    '';
  return text.slice(0, 600) || (geminiKey || nvidia.apiKey ? OFFLINE : EMPTY_TEXT);
}

function bearerToken(header: unknown): string {
  if (typeof header !== 'string') return '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Coach failed';
  return message.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[key]').replace(/nvapi-[0-9A-Za-z_-]{10,}/g, '[key]');
}

export default async function handler(
  req: { method?: string; body?: unknown; headers?: { authorization?: unknown; origin?: unknown } },
  res: ApiResponse
) {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method === 'GET') {
      // Health check only: does not reveal whether a key is configured.
      res.status(200).json({ ok: true });
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
    const uid = await projectUserId(idToken);
    if (!uid) {
      res.status(401).json({ error: 'Sign in required' });
      return;
    }
    if (rateLimited(uid)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const advice = await createTacticalAdvice(input.distanceTotal, input.recentRuns, process.env.GEMINI_API_KEY || '', {
      apiKey: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL,
    });
    res.status(200).json({ advice });
  } catch (error) {
    console.error('tactician', safeMessage(error));
    res.status(200).json({ advice: OFFLINE });
  }
}
