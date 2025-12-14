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
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT - BROOKLYN NY',
    cardMember: 'Jane Doe',
    accountNumber: '-5678',
    amount: -45.00,
  },
  {
    date: '17/01/2025',
    description: 'PAYMENT RECEIVED - THANK YOU',
    cardMember: 'John Doe',
    accountNumber: '-1234',
    amount: 500.00,
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
  },
];
