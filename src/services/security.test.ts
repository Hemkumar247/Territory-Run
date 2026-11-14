import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './authService';
import { rateLimited } from '../../api/tactician';

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
