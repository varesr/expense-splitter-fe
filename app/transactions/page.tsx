'use client';

import { useState, useMemo } from 'react';
import { TransactionFilterForm } from '@/components/features/transaction-filter-form';
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group';
import { useTransactions } from '@/hooks/use-transactions';
import { useExpenseSelections } from '@/hooks/use-expense-selections';
import { PaidBy } from '@/types/transaction';
import Link from 'next/link';

/**
 * Formats a date string from DD/MM/YYYY to "Mon DD/MM/YYYY" format
 * @param dateString - Date in DD/MM/YYYY format
 * @returns Formatted date with abbreviated day prefix
 */
function formatDateWithDay(dateString: string): string {
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[date.getDay()];
  return `${dayName} ${dateString}`;
}

interface FilterData {
  year: number;
  month: number;
}

export default function TransactionsPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterData | null>(null);

  const {
    data: transactions,
    isLoading,
    error,
  } = useTransactions(
    selectedFilter?.year || 0,
    selectedFilter?.month || 0,
    !!selectedFilter
  );

  const { getSelectionForTransaction, setSelectionForTransaction } = useExpenseSelections(transactions);

  const handleFilterSubmit = (data: FilterData) => {
    setSelectedFilter(data);
  };

  const handlePaidByChange = (index: number, value: PaidBy) => {
    const transaction = transactions?.[index];
    if (transaction) {
      setSelectionForTransaction(transaction, value);
    }
  };

  const getPaidByValue = (index: number): PaidBy => {
    const transaction = transactions?.[index];
    if (!transaction) return 'Roland';
    return getSelectionForTransaction(transaction);
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const totals = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { total: 0, roland: 0, chris: 0 };
    }

    let total = 0;
    let roland = 0;
    let chris = 0;

    transactions.forEach((transaction) => {
      const amount = transaction.amount;
      const paidBy = getSelectionForTransaction(transaction);

      total += amount;

      if (paidBy === 'Roland') {
        roland += amount;
      } else if (paidBy === 'Chris') {
        chris += amount;
      } else if (paidBy === 'Split') {
        roland += amount / 2;
        chris += amount / 2;
      }
    });

    return { total, roland, chris };
  }, [transactions, getSelectionForTransaction]);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center text-stone-900 dark:text-stone-50">Transactions</h1>

        <div className="flex flex-col items-center gap-8">
          <TransactionFilterForm onSubmit={handleFilterSubmit} />

          {selectedFilter && (
            <div className="w-full">
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-2 text-stone-900 dark:text-stone-50">
                  Transactions for {monthNames[selectedFilter.month - 1]} {selectedFilter.year}
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">
                  {isLoading
                    ? 'Loading transactions...'
                    : transactions
                    ? `${transactions.length} transaction(s) found`
                    : 'No transactions'}
                </p>
                {!isLoading && transactions && transactions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 dark:bg-stone-800/50 rounded-lg p-4">
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                        Transactions Total
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          totals.total >= 0
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        £{Math.abs(totals.total).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-stone-800/50 rounded-lg p-4">
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                        Roland&apos;s Total
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          totals.roland >= 0
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        £{Math.abs(totals.roland).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-stone-800/50 rounded-lg p-4">
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                        Chris&apos;s Total
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          totals.chris >= 0
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        £{Math.abs(totals.chris).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-800 dark:text-red-200 font-semibold">Error loading transactions</p>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error.message}</p>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              )}

              {!isLoading && transactions && transactions.length > 0 && (
                <>
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
                        <thead className="bg-stone-50 dark:bg-stone-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                              Card Member
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                              Account
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                              Paid By
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-stone-800 divide-y divide-stone-200 dark:divide-stone-700">
                          {transactions.map((transaction, index) => (
                            <tr
                              key={`${transaction.date}-${transaction.accountNumber}-${index}`}
                              className="hover:bg-stone-50 dark:hover:bg-stone-700"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-stone-100">
                                {formatDateWithDay(transaction.date)}
                              </td>
                              <td className="px-6 py-4 text-sm text-stone-900 dark:text-stone-100">
                                {transaction.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700 dark:text-stone-300">
                                {transaction.cardMember}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-400">
                                {transaction.accountNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                <span
                                  className={
                                    transaction.amount >= 0
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }
                                >
                                  £{Math.abs(transaction.amount).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <ToggleButtonGroup
                                  value={getPaidByValue(index)}
                                  onChange={(value) => handlePaidByChange(index, value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </>
              )}

              {!isLoading && transactions && transactions.length === 0 && (
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-8 text-center">
                  <p className="text-stone-600 dark:text-stone-400">
                    No transactions found for {monthNames[selectedFilter.month - 1]}{' '}
                    {selectedFilter.year}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
