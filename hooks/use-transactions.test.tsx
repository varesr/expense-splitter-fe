import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransactions, useHealthCheck } from './use-transactions';
import { transactionService } from '@/services/transaction-service';
import { mockTransactions } from '@/tests/fixtures/transactions';
import type { ReactNode } from 'react';

vi.mock('@/services/transaction-service');

const mockedTransactionService = vi.mocked(transactionService);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryDelay: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns transaction data on successful fetch', async () => {
    mockedTransactionService.getTransactionsByYearAndMonth.mockResolvedValue(
      mockTransactions
    );

    const { result } = renderHook(() => useTransactions(2025, 1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTransactions);
    expect(
      mockedTransactionService.getTransactionsByYearAndMonth
    ).toHaveBeenCalledWith(2025, 1);
  });

  it('handles loading state correctly', () => {
    mockedTransactionService.getTransactionsByYearAndMonth.mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useTransactions(2025, 1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles error state correctly', async () => {
    const errorMessage = 'Failed to fetch transactions';
    mockedTransactionService.getTransactionsByYearAndMonth.mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useTransactions(2025, 1), {
      wrapper: createWrapper(),
    });

    // Wait for retry to complete (hook has retry: 1)
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('does not fetch when enabled is false', async () => {
    mockedTransactionService.getTransactionsByYearAndMonth.mockResolvedValue(
      mockTransactions
    );

    const { result } = renderHook(() => useTransactions(2025, 1, false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(
      mockedTransactionService.getTransactionsByYearAndMonth
    ).not.toHaveBeenCalled();
  });

  it('fetches with correct year and month parameters', async () => {
    mockedTransactionService.getTransactionsByYearAndMonth.mockResolvedValue([]);

    const { result } = renderHook(() => useTransactions(2024, 6), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(
      mockedTransactionService.getTransactionsByYearAndMonth
    ).toHaveBeenCalledWith(2024, 6);
  });
});

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns health status on success', async () => {
    const healthMessage = 'OK';
    mockedTransactionService.healthCheck.mockResolvedValue(healthMessage);

    const { result } = renderHook(() => useHealthCheck(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(healthMessage);
    expect(mockedTransactionService.healthCheck).toHaveBeenCalled();
  });

  it('handles error state correctly', async () => {
    mockedTransactionService.healthCheck.mockRejectedValue(
      new Error('Health check failed')
    );

    const { result } = renderHook(() => useHealthCheck(), {
      wrapper: createWrapper(),
    });

    // Wait for retries to complete (hook has retry: 3)
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.error?.message).toBe('Health check failed');
  });
});
