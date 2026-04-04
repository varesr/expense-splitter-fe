'use client';

import { useState, useMemo } from 'react';
import { TransactionFilterForm } from '@/components/features/transaction-filter-form';
import { AddTransactionPopup } from '@/components/features/add-transaction-popup';
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group';
import { useTransactions } from '@/hooks/use-transactions';
import { useExpenseSelections } from '@/hooks/use-expense-selections';
import { PaidBy } from '@/types/transaction';
import { Toast } from '@/components/ui/toast';
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

interface SourceTotals {
  source: string;
  total: number;
  roland: number;
  chris: number;
}

export default function TransactionsPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterData | null>(null);
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);

  const {
    data: transactions,
    isLoading,
    error,
  } = useTransactions(
    selectedFilter?.year || 0,
    selectedFilter?.month || 0,
    !!selectedFilter
  );

  const {
    getSelectionForTransaction,
    setSelectionForTransaction,
    error: saveError,
    clearError,
  } = useExpenseSelections(transactions, selectedFilter?.year, selectedFilter?.month);

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

  const sourceTotals = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const bySource: Record<string, SourceTotals> = {};

    transactions.forEach((transaction) => {
      const source = transaction.source || 'Unknown';
      if (!bySource[source]) {
        bySource[source] = { source, total: 0, roland: 0, chris: 0 };
      }

      const amount = transaction.amount;
      const paidBy = getSelectionForTransaction(transaction);

      bySource[source].total += amount;

      if (paidBy === 'Roland') {
        bySource[source].roland += amount;
      } else if (paidBy === 'Chris') {
        bySource[source].chris += amount;
      } else if (paidBy === 'Split') {
        bySource[source].roland += amount / 2;
        bySource[source].chris += amount / 2;
      }
    });

    // Sort: Custom last, rest alphabetical
    return Object.values(bySource).sort((a, b) => {
      if (a.source === 'Custom') return 1;
      if (b.source === 'Custom') return -1;
      return a.source.localeCompare(b.source);
    });
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
          <TransactionFilterForm
            onSubmit={handleFilterSubmit}
            onAddTransaction={() => setIsAddPopupOpen(true)}
          />

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
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="summary-table">
                      <thead>
                        <tr className="border-b border-primary-200 dark:border-primary-700">
                          <th className="text-left py-2 pr-4 text-stone-600 dark:text-stone-400 font-medium">Source</th>
                          <th className="text-right py-2 px-4 text-stone-600 dark:text-stone-400 font-medium">Total</th>
                          <th className="text-right py-2 px-4 text-stone-600 dark:text-stone-400 font-medium">Roland</th>
                          <th className="text-right py-2 pl-4 text-stone-600 dark:text-stone-400 font-medium">Chris</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-primary-100 dark:border-primary-800">
                          <td className="py-2 pr-4 font-semibold text-stone-900 dark:text-stone-50">All</td>
                          <td className={`py-2 px-4 text-right font-bold text-lg ${totals.total >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                            £{Math.abs(totals.total).toFixed(2)}
                          </td>
                          <td className={`py-2 px-4 text-right font-bold text-lg ${totals.roland >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                            £{Math.abs(totals.roland).toFixed(2)}
                          </td>
                          <td className={`py-2 pl-4 text-right font-bold text-lg ${totals.chris >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                            £{Math.abs(totals.chris).toFixed(2)}
                          </td>
                        </tr>
                        {sourceTotals.map((st) => (
                          <tr key={st.source}>
                            <td className="py-1.5 pr-4 text-stone-500 dark:text-stone-400 text-xs">{st.source}</td>
                            <td className={`py-1.5 px-4 text-right text-xs ${st.total >= 0 ? 'text-stone-600 dark:text-stone-300' : 'text-red-500 dark:text-red-400'}`}>
                              £{Math.abs(st.total).toFixed(2)}
                            </td>
                            <td className={`py-1.5 px-4 text-right text-xs ${st.roland >= 0 ? 'text-stone-600 dark:text-stone-300' : 'text-red-500 dark:text-red-400'}`}>
                              £{Math.abs(st.roland).toFixed(2)}
                            </td>
                            <td className={`py-1.5 pl-4 text-right text-xs ${st.chris >= 0 ? 'text-stone-600 dark:text-stone-300' : 'text-red-500 dark:text-red-400'}`}>
                              £{Math.abs(st.chris).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                              Source
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
                              key={`${transaction.date}-${transaction.source}-${index}`}
                              className="hover:bg-stone-50 dark:hover:bg-stone-700"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-stone-100">
                                {formatDateWithDay(transaction.date)}
                              </td>
                              <td className="px-6 py-4 text-sm text-stone-900 dark:text-stone-100">
                                {transaction.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700 dark:text-stone-300">
                                {transaction.source}
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
      {saveError && <Toast message={saveError} onDismiss={clearError} />}
      {isAddPopupOpen && selectedFilter && (
        <AddTransactionPopup
          year={selectedFilter.year}
          month={selectedFilter.month}
          onClose={() => setIsAddPopupOpen(false)}
        />
      )}
    </main>
  );
}
