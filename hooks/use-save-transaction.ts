import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTransactionRequest } from '@/types/transaction';
import { transactionService } from '@/services/transaction-service';

export function useSaveTransaction(year?: number, month?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTransactionRequest) =>
      transactionService.saveTransaction(request),
    onSuccess: () => {
      if (year !== undefined && month !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['transactions', year, month] });
      }
    },
  });
}
