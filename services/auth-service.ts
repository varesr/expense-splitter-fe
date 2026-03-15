import type { LoginResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
  async login(
    username: string,
    password: string
  ): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw new Error('Login failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    document.cookie = 'auth_status=; Max-Age=0; Path=/';
  },

  async me(): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Not authenticated');
    }

    return response.json();
  },
};
