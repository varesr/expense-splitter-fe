'use client';

import { PaidBy } from '@/types/transaction';

interface ToggleButtonGroupProps {
  value: PaidBy;
  onChange: (value: PaidBy) => void;
  options?: PaidBy[];
  /** When true, the group stretches to fill its container and each segment flexes to an equal share. */
  fullWidth?: boolean;
}

export function ToggleButtonGroup({
  value,
  onChange,
  options = ['Roland', 'Split', 'Chris'],
  fullWidth = false,
}: ToggleButtonGroupProps) {
  return (
    <div className={`${fullWidth ? 'flex w-full' : 'inline-flex'} rounded-md shadow-sm`} role="group">
      {options.map((option, index) => {
        const isSelected = value === option;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`
              px-3 py-1.5 text-xs font-medium transition-colors duration-200
              ${fullWidth ? 'flex-1' : ''}
              ${isFirst ? 'rounded-l-md' : ''}
              ${isLast ? 'rounded-r-md' : ''}
              ${!isFirst ? '-ml-px' : ''}
              ${
                isSelected
                  ? 'bg-primary-600 text-white border border-primary-600 z-10'
                  : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-600'
              }
              focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
            `}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
