import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TEST_API_URL = 'http://localhost:8080';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
});

import { authService } from './auth-service';

describe('authService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('login', () => {
    it('returns login response on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ displayName: 'Test User' }),
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({ displayName: 'Test User' });
      expect(fetch).toHaveBeenCalledWith(`${TEST_API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test@example.com', password: 'password123' }),
      });
    });

    it('throws error on 401 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        authService.login('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws generic error on non-401 failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('calls logout endpoint and clears cookie', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await authService.logout();

      expect(fetch).toHaveBeenCalledWith(`${TEST_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      expect(document.cookie).toContain('auth_status=');
    });
  });

  describe('me', () => {
    it('returns user info on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ displayName: 'Test User' }),
      });

      const result = await authService.me();

      expect(result).toEqual({ displayName: 'Test User' });
      expect(fetch).toHaveBeenCalledWith(`${TEST_API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('throws error when not authenticated', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(authService.me()).rejects.toThrow('Not authenticated');
    });
  });
});
