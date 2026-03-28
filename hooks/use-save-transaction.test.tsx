import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSaveTransaction } from './use-save-transaction';
import { transactionService } from '@/services/transaction-service';

vi.mock('@/services/transaction-service', () => ({
  transactionService: {
    saveTransaction: vi.fn(),
  },
}));

const mockedSaveTransaction = vi.mocked(transactionService.saveTransaction);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useSaveTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSaveTransaction.mockResolvedValue(undefined);
  });

  it('calls saveTransaction service on mutate', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSaveTransaction(2026, 3), {
      wrapper: Wrapper,
    });

    const request = {
      day: '15',
      month: '03',
      year: '2026',
      description: 'Test expense',
      amount: '34.20',
      paidBy: 'Roland',
    };

    act(() => {
      result.current.mutate(request);
    });

    await waitFor(() => {
      expect(mockedSaveTransaction).toHaveBeenCalledWith(request);
    });
  });

  it('invalidates transactions query on success', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSaveTransaction(2026, 3), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        day: '15',
        month: '03',
        year: '2026',
        description: 'Test',
        amount: '10.00',
        paidBy: 'Roland',
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['transactions', 2026, 3],
      });
    });
  });

  it('returns error on failure', async () => {
    mockedSaveTransaction.mockRejectedValue(new Error('Server error'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSaveTransaction(2026, 3), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        day: '15',
        month: '03',
        year: '2026',
        description: 'Test',
        amount: '10.00',
        paidBy: 'Roland',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
