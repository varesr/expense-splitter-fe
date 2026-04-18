'use client';

import { useState, useMemo } from 'react';
import { TransactionFilterForm } from '@/components/features/transaction-filter-form';
import { AddTransactionPopup } from '@/components/features/add-transaction-popup';
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group';
import { useTransactions } from '@/hooks/use-transactions';
import { useExpenseSelections } from '@/hooks/use-expense-selections';
import { PaidBy, Transaction } from '@/types/transaction';
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

function formatSignedAmount(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}£${Math.abs(value).toFixed(2)}`;
}

interface FilterData {
  year: number;
  month: number;
}

interface SharedSourceTotals {
  source: string;
  total: number;
  roland: number;
  chris: number;
}

interface Balance {
  person: string;
  amount: number;
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

  const handlePaidByChange = (transaction: Transaction, value: PaidBy) => {
    setSelectionForTransaction(transaction, value);
  };

  const getPaidByValue = (transaction: Transaction): PaidBy => {
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

  const sortedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return [...transactions].sort((a, b) => {
      // Custom first, then alphabetical by source
      if (a.source === 'Custom' && b.source !== 'Custom') return -1;
      if (a.source !== 'Custom' && b.source === 'Custom') return 1;
      if (a.source !== b.source) return a.source.localeCompare(b.source);

      // Within same source, sort by date descending (newest first)
      const [dayA, monthA, yearA] = a.date.split('/').map(Number);
      const [dayB, monthB, yearB] = b.date.split('/').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions]);

  const { sharedTotals, sharedSourceTotals, balance } = useMemo(() => {
    const emptyResult = {
      sharedTotals: { total: 0, roland: 0, chris: 0 },
      sharedSourceTotals: [] as SharedSourceTotals[],
      balance: { person: '', amount: 0 } as Balance,
    };

    if (!transactions || transactions.length === 0) return emptyResult;

    const totals = { total: 0, roland: 0, chris: 0 };
    const bySource: Record<string, SharedSourceTotals> = {};
    let chrisOwes = 0;
    let rolandOwes = 0;

    transactions.forEach((transaction) => {
      const originallyPaidBy = transaction.originallyPaidBy || 'Roland';
      const paidBy = getSelectionForTransaction(transaction);

      // Exclude non-shared expenses (person paid for themselves)
      if (originallyPaidBy === paidBy) return;

      const amount = transaction.amount;
      const source = transaction.source || 'Unknown';

      if (!bySource[source]) {
        bySource[source] = { source, total: 0, roland: 0, chris: 0 };
      }

      totals.total += amount;
      bySource[source].total += amount;

      if (originallyPaidBy === 'Roland') {
        totals.roland += amount;
        bySource[source].roland += amount;
      } else if (originallyPaidBy === 'Chris') {
        totals.chris += amount;
        bySource[source].chris += amount;
      }

      // Signed amount: negatives represent refunds/cashbacks that reduce the debt.
      if (paidBy === 'Split') {
        if (originallyPaidBy === 'Roland') {
          chrisOwes += amount / 2;
        } else if (originallyPaidBy === 'Chris') {
          rolandOwes += amount / 2;
        }
      } else if (paidBy === 'Chris' && originallyPaidBy === 'Roland') {
        chrisOwes += amount;
      } else if (paidBy === 'Roland' && originallyPaidBy === 'Chris') {
        rolandOwes += amount;
      }
    });

    const netBalance = chrisOwes - rolandOwes;
    const balance: Balance = netBalance >= 0
      ? { person: 'Chris', amount: netBalance }
      : { person: 'Roland', amount: Math.abs(netBalance) };

    // Sort: Custom last, rest alphabetical
    const sortedSourceTotals = Object.values(bySource).sort((a, b) => {
      if (a.source === 'Custom') return 1;
      if (b.source === 'Custom') return -1;
      return a.source.localeCompare(b.source);
    });

    return {
      sharedTotals: totals,
      sharedSourceTotals: sortedSourceTotals,
      balance,
    };
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
                  <>
                    <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Shared Expenses</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" data-testid="summary-table">
                        <thead>
                          <tr className="border-b border-primary-200 dark:border-primary-700">
                            <th className="text-left py-2 pr-4 text-stone-600 dark:text-stone-400 font-medium">Source</th>
                            <th className="text-right py-2 px-4 text-stone-600 dark:text-stone-400 font-medium">Total</th>
                            <th className="text-right py-2 px-4 text-stone-600 dark:text-stone-400 font-medium">Paid by Roland</th>
                            <th className="text-right py-2 pl-4 text-stone-600 dark:text-stone-400 font-medium">Paid by Chris</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-primary-100 dark:border-primary-800">
                            <td className="py-2 pr-4 font-semibold text-stone-900 dark:text-stone-50">All</td>
                            <td className={`py-2 px-4 text-right font-bold text-lg ${sharedTotals.total >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatSignedAmount(sharedTotals.total)}
                            </td>
                            <td className={`py-2 px-4 text-right font-bold text-lg ${sharedTotals.roland >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatSignedAmount(sharedTotals.roland)}
                            </td>
                            <td className={`py-2 pl-4 text-right font-bold text-lg ${sharedTotals.chris >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatSignedAmount(sharedTotals.chris)}
                            </td>
                          </tr>
                          {sharedSourceTotals.map((st) => (
                            <tr key={st.source}>
                              <td className="py-1.5 pr-4 text-stone-500 dark:text-stone-400 text-xs">{st.source}</td>
                              <td className={`py-1.5 px-4 text-right text-xs ${st.total >= 0 ? 'text-stone-600 dark:text-stone-300' : 'text-red-500 dark:text-red-400'}`}>
                                {formatSignedAmount(st.total)}
                              </td>
                              <td className={`py-1.5 px-4 text-right text-xs ${st.roland >= 0 ? 'text-stone-600 dark:text-stone-300' : 'text-red-500 dark:text-red-400'}`}>
                                {formatSignedAmount(st.roland)}
                              </td>
                              <td className={`py-1.5 pl-4 text-right text-xs ${st.chris >= 0 ? 'text-stone-600 dark:text-stone-300' : 'text-red-500 dark:text-red-400'}`}>
                                {formatSignedAmount(st.chris)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 pt-3 border-t border-primary-200 dark:border-primary-700" data-testid="balance-section">
                      {balance.amount === 0 ? (
                        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">All settled</p>
                      ) : (
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {balance.person} still owes: <span className="text-primary-600 dark:text-primary-400">£{balance.amount.toFixed(2)}</span>
                        </p>
                      )}
                    </div>
                  </>
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

              {!isLoading && sortedTransactions.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table data-testid="transactions-table" className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
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
                        {sortedTransactions.map((transaction, index) => (
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
                                {formatSignedAmount(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <ToggleButtonGroup
                                value={getPaidByValue(transaction)}
                                onChange={(value) => handlePaidByChange(transaction, value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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
