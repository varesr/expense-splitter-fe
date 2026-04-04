import type { Transaction } from '@/types/transaction';

/**
 * Mock transaction data for testing
 */
export const mockTransactions: Transaction[] = [
  {
    date: '15/01/2025',
    description: 'GROCERY STORE - NEW YORK NY',
    cardMember: 'John Doe',
    accountNumber: '-1234',
    amount: -125.50,
    paidBy: null,
    source: 'Amex',
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT - BROOKLYN NY',
    cardMember: 'Jane Doe',
    accountNumber: '-5678',
    amount: -45.00,
    paidBy: null,
    source: 'Amex',
  },
  {
    date: '17/01/2025',
    description: 'PAYMENT RECEIVED - THANK YOU',
    cardMember: 'John Doe',
    accountNumber: '-1234',
    amount: 500.00,
    paidBy: null,
    source: 'Amex',
  },
];

export const mockEmptyTransactions: Transaction[] = [];

export const mockSingleTransaction: Transaction[] = [
  {
    date: '01/03/2025',
    description: 'COFFEE SHOP - MANHATTAN NY',
    cardMember: 'John Doe',
    accountNumber: '-1234',
    amount: -5.75,
    paidBy: null,
    source: 'Amex',
  },
];

export const mockCustomTransaction: Transaction = {
  date: '28/03/2026',
  description: 'Custom expense',
  amount: 25.50,
  paidBy: 'Roland',
  source: 'Custom',
};

export const mockMixedTransactions: Transaction[] = [
  {
    date: '15/01/2025',
    description: 'GROCERY STORE - NEW YORK NY',
    cardMember: 'John Doe',
    accountNumber: '-1234',
    amount: -125.50,
    paidBy: null,
    source: 'Amex',
  },
  {
    date: '28/01/2025',
    description: 'Custom expense',
    amount: 25.50,
    paidBy: 'Roland',
    source: 'Custom',
  },
];
