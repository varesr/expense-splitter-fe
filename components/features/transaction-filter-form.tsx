'use client';

import { useForm } from 'react-hook-form';

interface TransactionFilterFormData {
  year: number;
  month: number;
}

interface TransactionFilterFormProps {
  onSubmit: (data: TransactionFilterFormData) => void;
}

export function TransactionFilterForm({ onSubmit }: TransactionFilterFormProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFilterFormData>({
    defaultValues: {
      year: currentYear,
      month: currentMonth,
    },
  });

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-md p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-stone-900 dark:text-stone-50">Filter Transactions</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300"
            >
              Year
            </label>
            <select
              id="year"
              {...register('year', {
                required: 'Year is required',
                valueAsNumber: true,
              })}
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.year && (
              <span className="text-red-500 text-sm mt-1">{errors.year.message}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="month"
              className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300"
            >
              Month
            </label>
            <select
              id="month"
              {...register('month', {
                required: 'Month is required',
                valueAsNumber: true,
              })}
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {errors.month && (
              <span className="text-red-500 text-sm mt-1">{errors.month.message}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
        >
          Apply Filter
        </button>
      </div>
    </form>
  );
}
