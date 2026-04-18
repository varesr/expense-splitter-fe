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
    originallyPaidBy: 'Roland',
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT - BROOKLYN NY',
    cardMember: 'Jane Doe',
    accountNumber: '-5678',
    amount: -45.00,
    paidBy: null,
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
  {
    date: '17/01/2025',
    description: 'PAYMENT RECEIVED - THANK YOU',
    cardMember: 'John Doe',
    accountNumber: '-1234',
    amount: 500.00,
    paidBy: null,
    source: 'Amex',
    originallyPaidBy: 'Roland',
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
    originallyPaidBy: 'Roland',
  },
];

export const mockCustomTransaction: Transaction = {
  date: '28/03/2026',
  description: 'Custom expense',
  amount: 25.50,
  paidBy: 'Roland',
  source: 'Custom',
  originallyPaidBy: 'Roland',
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
    originallyPaidBy: 'Roland',
  },
  {
    date: '28/01/2025',
    description: 'Custom expense',
    amount: 25.50,
    paidBy: 'Roland',
    source: 'Custom',
    originallyPaidBy: 'Roland',
  },
];

export const mockSharedExpenseTransactions: Transaction[] = [
  {
    date: '10/01/2025',
    description: 'Amex Transaction A',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: 20.00,
    paidBy: 'Split',
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
  {
    date: '12/01/2025',
    description: 'Amex Transaction B',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: 10.00,
    paidBy: 'Split',
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
  {
    date: '15/01/2025',
    description: 'Amex Transaction E - not shared',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: 10.00,
    paidBy: 'Roland',
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
  {
    date: '18/01/2025',
    description: 'Custom Transaction C',
    amount: 10.00,
    paidBy: 'Split',
    source: 'Custom',
    originallyPaidBy: 'Chris',
  },
  {
    date: '20/01/2025',
    description: 'Custom Transaction D',
    amount: 10.00,
    paidBy: 'Chris',
    source: 'Custom',
    originallyPaidBy: 'Roland',
  },
  {
    date: '22/01/2025',
    description: 'Amex Transaction F - not shared',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: 30.00,
    paidBy: 'Roland',
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
];
