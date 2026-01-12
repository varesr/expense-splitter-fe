import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { useExpenseSelections } from './use-expense-selections';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const mockTransactions: Transaction[] = [
  {
    date: '15/01/2025',
    description: 'GROCERY STORE',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -100.0,
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT',
    cardMember: 'Chris',
    accountNumber: '-5678',
    amount: -50.0,
  },
];

describe('useExpenseSelections', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns default value (Roland) when no saved selection exists', () => {
    const { result } = renderHook(() => useExpenseSelections(mockTransactions));

    const value = result.current.getSelectionForTransaction(mockTransactions[0]);
    expect(value).toBe('Roland');
  });

  it('saves selection to localStorage when changed', () => {
    const { result } = renderHook(() => useExpenseSelections(mockTransactions));

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Split');
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('updates state when selection is changed', () => {
    const { result } = renderHook(() => useExpenseSelections(mockTransactions));

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Chris');
    });

    const value = result.current.getSelectionForTransaction(mockTransactions[0]);
    expect(value).toBe('Chris');
  });

  it('handles undefined transactions', () => {
    const { result } = renderHook(() => useExpenseSelections(undefined));

    expect(result.current.getSelectionForTransaction).toBeDefined();
    expect(result.current.setSelectionForTransaction).toBeDefined();
  });

  it('handles empty transactions array', () => {
    const { result } = renderHook(() => useExpenseSelections([]));

    expect(result.current.getSelectionForTransaction).toBeDefined();
    expect(result.current.setSelectionForTransaction).toBeDefined();
  });

  it('loads saved selection from localStorage on mount', () => {
    // Pre-populate localStorage
    const key = 'expense-selection:2025:01:15:-100.00';
    localStorageMock.setItem(key, 'Chris');
    localStorageMock.getItem.mockImplementation((k: string) => (k === key ? 'Chris' : null));

    const { result } = renderHook(() => useExpenseSelections(mockTransactions));

    const value = result.current.getSelectionForTransaction(mockTransactions[0]);
    expect(value).toBe('Chris');
  });

  it('persists different selections for different transactions', () => {
    const { result } = renderHook(() => useExpenseSelections(mockTransactions));

    act(() => {
      result.current.setSelectionForTransaction(mockTransactions[0], 'Chris');
      result.current.setSelectionForTransaction(mockTransactions[1], 'Split');
    });

    expect(result.current.getSelectionForTransaction(mockTransactions[0])).toBe('Chris');
    expect(result.current.getSelectionForTransaction(mockTransactions[1])).toBe('Split');
  });
});
