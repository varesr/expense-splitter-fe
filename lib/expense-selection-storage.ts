import type { PaidBy } from '@/types/transaction';

const STORAGE_KEY_PREFIX = 'expense-selection';

/**
 * Interface for identifying a transaction uniquely
 */
export interface TransactionIdentifier {
  year: number;
  month: number;
  day: number;
  amount: number;
}

/**
 * Generates a localStorage key for a transaction
 * Format: expense-selection:{year}:{month}:{day}:{amount}
 */
export function generateStorageKey(identifier: TransactionIdentifier): string {
  const { year, month, day, amount } = identifier;
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  const normalizedAmount = amount.toFixed(2);
  return `${STORAGE_KEY_PREFIX}:${year}:${paddedMonth}:${paddedDay}:${normalizedAmount}`;
}

/**
 * Parses a date string in DD/MM/YYYY format to extract components
 */
export function parseDateString(dateString: string): { day: number; month: number; year: number } {
  const [day, month, year] = dateString.split('/').map(Number);
  return { day, month, year };
}

/**
 * Creates a TransactionIdentifier from transaction data
 */
export function createIdentifierFromTransaction(
  date: string,
  amount: number
): TransactionIdentifier {
  const { day, month, year } = parseDateString(date);
  return { year, month, day, amount };
}

/**
 * Validates if a value is a valid PaidBy option
 */
export function isValidPaidBy(value: unknown): value is PaidBy {
  return value === 'Roland' || value === 'Split' || value === 'Chris';
}

