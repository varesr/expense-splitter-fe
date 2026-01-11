import type { Transaction } from '@/types/transaction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Service for interacting with the transactions API
 */
export const transactionService = {
  /**
   * Fetch transactions for a specific year and month
   * @param year - The year to query (e.g., 2025)
   * @param month - The month to query (1-12)
   * @returns Promise resolving to array of transactions
   */
  async getTransactionsByYearAndMonth(
    year: number,
    month: number
  ): Promise<Transaction[]> {
    const response = await fetch(
      `${API_BASE_URL}/transactions/${year}/${month}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Invalid year or month parameter');
      }
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data: Transaction[] = await response.json();
    return data;
  },

  /**
   * Health check endpoint
   * @returns Promise resolving to health status message
   */
  async healthCheck(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.text();
  },
};
