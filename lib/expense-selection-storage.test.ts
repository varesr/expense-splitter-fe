import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateStorageKey,
  parseDateString,
  createIdentifierFromTransaction,
  isValidPaidBy,
  saveSelection,
  getSelection,
} from './expense-selection-storage';

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

describe('expense-selection-storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('generateStorageKey', () => {
    it('generates correct key format', () => {
      const key = generateStorageKey({
        year: 2025,
        month: 1,
        day: 15,
        amount: -125.5,
      });
      expect(key).toBe('expense-selection:2025:01:15:-125.50');
    });

    it('pads single digit month and day', () => {
      const key = generateStorageKey({
        year: 2025,
        month: 3,
        day: 5,
        amount: 50.0,
      });
      expect(key).toBe('expense-selection:2025:03:05:50.00');
    });

    it('normalizes amount to two decimal places', () => {
      const key = generateStorageKey({
        year: 2025,
        month: 12,
        day: 25,
        amount: 100,
      });
      expect(key).toBe('expense-selection:2025:12:25:100.00');
    });
  });

  describe('parseDateString', () => {
    it('parses DD/MM/YYYY format correctly', () => {
      const result = parseDateString('15/01/2025');
      expect(result).toEqual({ day: 15, month: 1, year: 2025 });
    });

    it('handles double digit month and day', () => {
      const result = parseDateString('25/12/2024');
      expect(result).toEqual({ day: 25, month: 12, year: 2024 });
    });
  });

  describe('createIdentifierFromTransaction', () => {
    it('creates identifier from date and amount', () => {
      const result = createIdentifierFromTransaction('15/01/2025', -125.5);
      expect(result).toEqual({
        year: 2025,
        month: 1,
        day: 15,
        amount: -125.5,
      });
    });
  });

  describe('isValidPaidBy', () => {
    it('returns true for valid values', () => {
      expect(isValidPaidBy('Roland')).toBe(true);
      expect(isValidPaidBy('Split')).toBe(true);
      expect(isValidPaidBy('Chris')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isValidPaidBy('Invalid')).toBe(false);
      expect(isValidPaidBy('')).toBe(false);
      expect(isValidPaidBy(null)).toBe(false);
      expect(isValidPaidBy(undefined)).toBe(false);
    });
  });

  describe('saveSelection', () => {
    it('saves selection to localStorage', () => {
      const identifier = { year: 2025, month: 1, day: 15, amount: -100 };
      saveSelection(identifier, 'Chris');

      const key = generateStorageKey(identifier);
      expect(localStorage.getItem(key)).toBe('Chris');
    });
  });

  describe('getSelection', () => {
    it('retrieves saved selection', () => {
      const identifier = { year: 2025, month: 1, day: 15, amount: -100 };
      saveSelection(identifier, 'Split');

      const result = getSelection(identifier);
      expect(result).toBe('Split');
    });

    it('returns null for non-existent key', () => {
      const identifier = { year: 2025, month: 1, day: 15, amount: -100 };
      const result = getSelection(identifier);
      expect(result).toBeNull();
    });

    it('returns null for invalid stored value', () => {
      const identifier = { year: 2025, month: 1, day: 15, amount: -100 };
      const key = generateStorageKey(identifier);
      localStorage.setItem(key, 'InvalidValue');

      const result = getSelection(identifier);
      expect(result).toBeNull();
    });
  });
});
