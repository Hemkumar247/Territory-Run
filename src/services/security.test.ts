import { describe, expect, it, vi } from 'vitest';
import { authErrorMessage } from './authService';
import { createTacticalAdvice, rateLimited } from '../../api/tactician';

describe('authErrorMessage', () => {
  it('does not reveal whether an email is registered', () => {
    expect(authErrorMessage({ code: 'auth/user-not-found' })).toBe(authErrorMessage({ code: 'auth/wrong-password' }));
  });
  it('never leaks raw error text', () => {
    expect(authErrorMessage(new Error('{"userId":"abc","email":"a@b.c"}'))).toBe('Something went wrong. Please try again.');
  });
});

describe('rateLimited', () => {
  it('blocks the 11th request in a minute, then allows again after it', () => {
    const t = 1_000_000;
    for (let i = 0; i < 10; i++) expect(rateLimited('u1', t + i)).toBe(false);
    expect(rateLimited('u1', t + 11)).toBe(true);
    expect(rateLimited('u1', t + 61_000)).toBe(false);
  });
});

describe('createTacticalAdvice fallback', () => {
  const reply = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
  const gemini = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });
  const nvidia = (content: string) => ({ choices: [{ message: { content } }] });
  const mock = (g: () => Promise<Response>, n: () => Promise<Response>) =>
    vi.stubGlobal('fetch', vi.fn((url: string) => (url.includes('googleapis') ? g() : n())));

  it('uses Gemini when it works and never calls NVIDIA', async () => {
    mock(() => reply(gemini('from gemini')), () => reply(nvidia('from glm')));
    expect(await createTacticalAdvice(1, 1, 'g', { apiKey: 'n' })).toBe('from gemini');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['429', () => reply({}, false)],
    ['network error', () => Promise.reject(new Error('down'))],
    ['empty answer', () => reply(gemini(''))],
  ])('falls back to NVIDIA on Gemini %s', async (_n, g) => {
    mock(g, () => reply(nvidia('<think>x</think>from glm')));
    expect(await createTacticalAdvice(1, 1, 'g', { apiKey: 'n' })).toBe('from glm');
  });
  it('works with only the NVIDIA key, and degrades to the offline line if both fail', async () => {
    mock(() => reply({}, false), () => reply(nvidia('only glm')));
    expect(await createTacticalAdvice(1, 1, '', { apiKey: 'n' })).toBe('only glm');
    mock(() => reply({}, false), () => reply({}, false));
    expect(await createTacticalAdvice(1, 1, 'g', { apiKey: 'n' })).toContain('Offline');
  });
});
