import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLogin, useLogout, useCurrentUser } from './use-auth';
import type React from 'react';

vi.mock('@/services/auth-service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authService } from '@/services/auth-service';
const mockedLogin = vi.mocked(authService.login);
const mockedLogout = vi.mocked(authService.logout);
const mockedMe = vi.mocked(authService.me);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates currentUser query cache on successful login', async () => {
    const loginResponse = { displayName: 'Roland' };
    mockedLogin.mockResolvedValue(loginResponse);

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ username: 'test@example.com', password: 'pass123' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedUser = queryClient.getQueryData(['currentUser']);
    expect(cachedUser).toEqual({ displayName: 'Roland' });
  });

  it('does not populate cache on failed login', async () => {
    mockedLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ username: 'test@example.com', password: 'wrong' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cachedUser = queryClient.getQueryData(['currentUser']);
    expect(cachedUser).toBeUndefined();
  });
});

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears query cache on successful logout', async () => {
    mockedLogout.mockResolvedValue();

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(['currentUser'], { displayName: 'Roland' });

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedUser = queryClient.getQueryData(['currentUser']);
    expect(cachedUser).toBeUndefined();
  });
});

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches current user from auth service', async () => {
    mockedMe.mockResolvedValue({ displayName: 'Roland' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ displayName: 'Roland' });
    expect(mockedMe).toHaveBeenCalledOnce();
  });
});
