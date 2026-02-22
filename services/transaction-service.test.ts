import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockTransactions, mockEmptyTransactions } from '@/tests/fixtures/transactions';

const TEST_API_URL = 'http://localhost:8080';

// The service reads process.env.NEXT_PUBLIC_API_URL at module level,
// so we must set it before the module is imported.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
});

// Import after env is set
import { transactionService } from './transaction-service';

describe('transactionService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getTransactionsByYearAndMonth', () => {
    it('returns transactions on successful fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTransactions),
      });

      const result = await transactionService.getTransactionsByYearAndMonth(2025, 1);

      expect(result).toEqual(mockTransactions);
      expect(fetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/transactions/2025/1`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache, max-age=0, must-revalidate',
            'Expires': '0'
          },
        }
      );
    });

    it('returns empty array when no transactions exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmptyTransactions),
      });

      const result = await transactionService.getTransactionsByYearAndMonth(2025, 2);

      expect(result).toEqual([]);
    });

    it('throws error with invalid parameter message on 400 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        transactionService.getTransactionsByYearAndMonth(2025, 13)
      ).rejects.toThrow('Invalid year or month parameter');
    });

    it('throws error with status text on non-400 error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        transactionService.getTransactionsByYearAndMonth(2025, 1)
      ).rejects.toThrow('Failed to fetch transactions: Internal Server Error');
    });

    it('constructs correct URL with different year and month values', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmptyTransactions),
      });

      await transactionService.getTransactionsByYearAndMonth(2024, 12);

      expect(fetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/transactions/2024/12`,
        expect.any(Object)
      );
    });
  });

  describe('savePaidTransaction', () => {
    it('sends PUT request with correct body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      await transactionService.savePaidTransaction('expense-selection:2025:01:15:-100.00', 'Chris');

      expect(fetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/transactions/paid`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'expense-selection:2025:01:15:-100.00',
            paidBy: 'Chris',
          }),
        }
      );
    });

    it('throws error on 400 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        transactionService.savePaidTransaction('bad-key', 'Chris')
      ).rejects.toThrow('Invalid paid transaction data');
    });

    it('throws error on 500 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        transactionService.savePaidTransaction('expense-selection:2025:01:15:-100.00', 'Chris')
      ).rejects.toThrow('Failed to save paid transaction: Internal Server Error');
    });
  });

  describe('healthCheck', () => {
    it('returns health status text on success', async () => {
      const healthMessage = 'OK';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(healthMessage),
      });

      const result = await transactionService.healthCheck();

      expect(result).toBe(healthMessage);
      expect(fetch).toHaveBeenCalledWith(`${TEST_API_URL}/`, {
        method: 'GET',
      });
    });

    it('throws error when health check fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(transactionService.healthCheck()).rejects.toThrow(
        'Health check failed'
      );
    });
  });
});
