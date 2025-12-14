import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services/transaction-service';
import type { Transaction } from '@/types/transaction';

/**
 * Custom hook for fetching transactions by year and month
 * @param year - The year to query
 * @param month - The month to query (1-12)
 * @param enabled - Whether the query should run (defaults to true)
 * @returns TanStack Query result with transactions data
 */
export function useTransactions(year: number, month: number, enabled = true) {
  return useQuery<Transaction[], Error>({
    queryKey: ['transactions', year, month],
    queryFn: () => transactionService.getTransactionsByYearAndMonth(year, month),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Custom hook for API health check
 * @returns TanStack Query result with health status
 */
export function useHealthCheck() {
  return useQuery<string, Error>({
    queryKey: ['health'],
    queryFn: () => transactionService.healthCheck(),
    staleTime: 60 * 1000, // 1 minute
    retry: 3,
  });
}
