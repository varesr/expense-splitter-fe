import { useState, useEffect, useCallback } from 'react';
import type { PaidBy, Transaction } from '@/types/transaction';
import {
  createIdentifierFromTransaction,
  generateStorageKey,
  saveSelection,
  getSelection,
} from '@/lib/expense-selection-storage';

interface UseExpenseSelectionsResult {
  /** Get the PaidBy value for a transaction */
  getSelectionForTransaction: (transaction: Transaction) => PaidBy;
  /** Set the PaidBy value for a transaction (saves to localStorage) */
  setSelectionForTransaction: (transaction: Transaction, value: PaidBy) => void;
}

/**
 * Hook for managing expense selections with localStorage persistence
 *
 * @param transactions - Array of transactions for the current filter
 */
export function useExpenseSelections(
  transactions: Transaction[] | undefined
): UseExpenseSelectionsResult {
  // State to hold selections keyed by storage key
  const [selections, setSelections] = useState<Record<string, PaidBy>>({});

  // Load selections from localStorage when transactions change
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setSelections({});
      return;
    }

    const loadedSelections: Record<string, PaidBy> = {};

    transactions.forEach((transaction) => {
      const identifier = createIdentifierFromTransaction(transaction.date, transaction.amount);
      const key = generateStorageKey(identifier);
      const savedValue = getSelection(identifier);

      if (savedValue) {
        loadedSelections[key] = savedValue;
      }
    });

    setSelections(loadedSelections);
  }, [transactions]);

  const getSelectionForTransaction = useCallback(
    (transaction: Transaction): PaidBy => {
      const identifier = createIdentifierFromTransaction(transaction.date, transaction.amount);
      const key = generateStorageKey(identifier);
      return selections[key] || 'Roland';
    },
    [selections]
  );

  const setSelectionForTransaction = useCallback(
    (transaction: Transaction, value: PaidBy): void => {
      const identifier = createIdentifierFromTransaction(transaction.date, transaction.amount);
      const key = generateStorageKey(identifier);

      // Save to localStorage
      saveSelection(identifier, value);

      // Update state
      setSelections((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return {
    getSelectionForTransaction,
    setSelectionForTransaction,
  };
}
