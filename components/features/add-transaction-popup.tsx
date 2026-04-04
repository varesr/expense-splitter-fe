'use client';

import { useForm } from 'react-hook-form';
import { useCurrentUser } from '@/hooks/use-auth';
import { useSaveTransaction } from '@/hooks/use-save-transaction';

interface AddTransactionFormData {
  date: string;
  amount: string;
  description: string;
  paidBy: string;
}

interface AddTransactionPopupProps {
  year: number;
  month: number;
  onClose: () => void;
}

function formatAmount(value: string): string {
  if (/^\d+$/.test(value)) {
    return value + '.00';
  }
  if (/^\d+\.\d$/.test(value)) {
    return value + '0';
  }
  return value;
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AddTransactionPopup({ year, month, onClose }: AddTransactionPopupProps) {
  const { data: currentUser } = useCurrentUser();
  const saveTransaction = useSaveTransaction(year, month);

  const defaultPaidBy = currentUser?.displayName || 'Roland';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddTransactionFormData>({
    defaultValues: {
      date: getTodayString(),
      amount: '',
      description: '',
      paidBy: defaultPaidBy,
    },
  });

  const onSubmit = (data: AddTransactionFormData) => {
    const [yearStr, monthStr, dayStr] = data.date.split('-');
    const formattedAmount = formatAmount(data.amount);

    saveTransaction.mutate(
      {
        day: dayStr,
        month: monthStr,
        year: yearStr,
        description: data.description,
        amount: formattedAmount,
        paidBy: data.paidBy,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    if (formatted !== e.target.value) {
      setValue('amount', formatted);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="add-transaction-popup">
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Add Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="popup-date" className="block text-sm font-medium mb-1 text-stone-700 dark:text-stone-300">
              Date
            </label>
            <input
              id="popup-date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
            />
            {errors.date && (
              <span className="text-red-500 text-sm mt-1 block">{errors.date.message}</span>
            )}
          </div>

          <div>
            <label htmlFor="popup-amount" className="block text-sm font-medium mb-1 text-stone-700 dark:text-stone-300">
              Amount
            </label>
            <input
              id="popup-amount"
              type="text"
              inputMode="decimal"
              {...register('amount', {
                required: 'Amount is required',
                pattern: {
                  value: /^-?\d+(\.\d{1,2})?$/,
                  message: 'Enter a valid amount (e.g. 34.20)',
                },
              })}
              onBlur={handleAmountBlur}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
            />
            {errors.amount && (
              <span className="text-red-500 text-sm mt-1 block">{errors.amount.message}</span>
            )}
          </div>

          <div>
            <label htmlFor="popup-description" className="block text-sm font-medium mb-1 text-stone-700 dark:text-stone-300">
              Description
            </label>
            <input
              id="popup-description"
              type="text"
              {...register('description', { required: 'Description is required' })}
              placeholder="What was this expense for?"
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
            />
            {errors.description && (
              <span className="text-red-500 text-sm mt-1 block">{errors.description.message}</span>
            )}
          </div>

          <div>
            <label htmlFor="popup-paidBy" className="block text-sm font-medium mb-1 text-stone-700 dark:text-stone-300">
              Paid By
            </label>
            <select
              id="popup-paidBy"
              {...register('paidBy', { required: 'Paid By is required' })}
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
            >
              <option value="Roland">Roland</option>
              <option value="Chris">Chris</option>
              <option value="Split">Split</option>
            </select>
          </div>

          {saveTransaction.isError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">
                {saveTransaction.error?.message || 'Failed to save transaction. Please try again.'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saveTransaction.isPending}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            >
              {saveTransaction.isPending ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-200 hover:bg-stone-300 dark:bg-stone-600 dark:hover:bg-stone-500 text-stone-700 dark:text-stone-200 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
