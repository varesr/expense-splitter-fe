import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Transaction, PaidBy } from '@/types/transaction';
import { useExpenseSelections } from './use-expense-selections';
import { transactionService } from '@/services/transaction-service';

vi.mock('@/services/transaction-service', () => ({
  transactionService: {
    savePaidTransaction: vi.fn(),
  },
}));

const mockedSavePaidTransaction = vi.mocked(transactionService.savePaidTransaction);

const mockTransactions: Transaction[] = [
  {
    date: '15/01/2025',
    description: 'GROCERY STORE',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -100.0,
    paidBy: null,
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT',
    cardMember: 'Chris',
    accountNumber: '-5678',
    amount: -50.0,
    paidBy: 'Chris',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  // Pre-populate the cache with mock transactions
  queryClient.setQueryData(['transactions', 2025, 1], mockTransactions);

  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useExpenseSelections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSavePaidTransaction.mockResolvedValue(undefined);
  });

  it('returns default value (Roland) when transaction has no paidBy', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(mockTransactions, 2025, 1),
      { wrapper: Wrapper }
    );

    expect(result.current.getSelectionForTransaction(mockTransactions[0])).toBe('Roland');
  });

  it('returns paidBy from transaction when present', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(mockTransactions, 2025, 1),
      { wrapper: Wrapper }
    );

    expect(result.current.getSelectionForTransaction(mockTransactions[1])).toBe('Chris');
  });

  it('calls savePaidTransaction API when selection changes', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(mockTransactions, 2025, 1),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Split');
    });

    await waitFor(() => {
      expect(mockedSavePaidTransaction).toHaveBeenCalledWith(
        'expense-selection:2025:01:15:-100.00',
        'Split'
      );
    });
  });

  it('optimistically updates query cache on mutation', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(mockTransactions, 2025, 1),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Chris');
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Transaction[]>(['transactions', 2025, 1]);
      expect(cached?.[0].paidBy).toBe('Chris');
    });
  });

  it('reverts cache on API error and sets error state', async () => {
    mockedSavePaidTransaction.mockRejectedValue(new Error('Server error'));

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(mockTransactions, 2025, 1),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Chris');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to save selection. Please try again.');
    });

    // Cache should be reverted to original
    const cached = queryClient.getQueryData<Transaction[]>(['transactions', 2025, 1]);
    expect(cached?.[0].paidBy).toBeNull();
  });

  it('clears error when clearError is called', async () => {
    mockedSavePaidTransaction.mockRejectedValue(new Error('Server error'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(mockTransactions, 2025, 1),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Chris');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to save selection. Please try again.');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles undefined transactions gracefully', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections(undefined, 2025, 1),
      { wrapper: Wrapper }
    );

    expect(result.current.getSelectionForTransaction).toBeDefined();
    expect(result.current.setSelectionForTransaction).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('handles empty transactions array', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useExpenseSelections([], 2025, 1),
      { wrapper: Wrapper }
    );

    expect(result.current.getSelectionForTransaction).toBeDefined();
    expect(result.current.setSelectionForTransaction).toBeDefined();
  });
});
