/**
 * Transaction data types based on Swagger API definition
 */

/** Options for who paid for a transaction */
export type PaidBy = 'Roland' | 'Split' | 'Chris';

export interface Transaction {
  /** Transaction date in DD/MM/YYYY format */
  date: string;
  /** Merchant name and location description */
  description: string;
  /** Name of the card member who made the transaction */
  cardMember: string;
  /** Last digits of the account number (typically prefixed with hyphen) */
  accountNumber: string;
  /** Transaction amount (can be positive or negative) */
  amount: number;
}

export interface TransactionResponse {
  /** The year that was queried */
  year: number;
  /** The month that was queried (1-12) */
  month: number;
  /** List of transactions for the specified period */
  transactions: Transaction[];
  /** Sum of all transaction amounts for the period */
  totalAmount: number;
  /** Total number of transactions in the response */
  transactionCount: number;
}

export interface TransactionQueryParams {
  year: number;
  month: number;
}
