import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaidBy, Transaction } from '@/types/transaction';
import {
  createIdentifierFromTransaction,
  generateStorageKey,
} from '@/lib/expense-selection-storage';
import { transactionService } from '@/services/transaction-service';

interface UseExpenseSelectionsResult {
  /** Get the PaidBy value for a transaction */
  getSelectionForTransaction: (transaction: Transaction) => PaidBy;
  /** Set the PaidBy value for a transaction (saves via API) */
  setSelectionForTransaction: (transaction: Transaction, value: PaidBy) => void;
  /** Error from the last save attempt */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Hook for managing expense selections with backend API persistence.
 *
 * Reads paidBy from the transaction data returned by the API.
 * Writes via PUT /api/transactions/paid with optimistic updates.
 *
 * @param transactions - Array of transactions for the current filter
 * @param year - Current filter year (for cache invalidation)
 * @param month - Current filter month (for cache invalidation)
 */
export function useExpenseSelections(
  transactions: Transaction[] | undefined,
  year?: number,
  month?: number
): UseExpenseSelectionsResult {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const mutation = useMutation({
    mutationFn: ({ key, paidBy }: { key: string; paidBy: PaidBy }) =>
      transactionService.savePaidTransaction(key, paidBy),
    onMutate: async ({ key, paidBy }) => {
      if (year === undefined || month === undefined) return;

      const queryKey = ['transactions', year, month];
      await queryClient.cancelQueries({ queryKey });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKey);

      queryClient.setQueryData<Transaction[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((t) => {
          const identifier = createIdentifierFromTransaction(t.date, t.amount);
          const txKey = generateStorageKey(identifier);
          if (txKey === key) {
            return { ...t, paidBy };
          }
          return t;
        });
      });

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (year !== undefined && month !== undefined && context?.previousTransactions) {
        queryClient.setQueryData(
          ['transactions', year, month],
          context.previousTransactions
        );
      }
      setError('Failed to save selection. Please try again.');
    },
  });

  const getSelectionForTransaction = useCallback(
    (transaction: Transaction): PaidBy => {
      if (transaction.paidBy) {
        return transaction.paidBy;
      }
      return 'Roland';
    },
    []
  );

  const setSelectionForTransaction = useCallback(
    (transaction: Transaction, value: PaidBy): void => {
      const identifier = createIdentifierFromTransaction(transaction.date, transaction.amount);
      const key = generateStorageKey(identifier);
      mutation.mutate({ key, paidBy: value });
    },
    [mutation]
  );

  return {
    getSelectionForTransaction,
    setSelectionForTransaction,
    error,
    clearError,
  };
}
