import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionFilterForm } from './transaction-filter-form';

describe('TransactionFilterForm', () => {
  it('renders year and month selectors', () => {
    const onSubmit = vi.fn();
    render(<TransactionFilterForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Month')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    const onSubmit = vi.fn();
    render(<TransactionFilterForm onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: /apply filter/i })).toBeInTheDocument();
  });

  it('calls onSubmit with selected values when form is submitted', () => {
    const onSubmit = vi.fn();
    render(<TransactionFilterForm onSubmit={onSubmit} />);

    const yearSelect = screen.getByLabelText('Year');
    const monthSelect = screen.getByLabelText('Month');
    const submitButton = screen.getByRole('button', { name: /apply filter/i });

    fireEvent.change(yearSelect, { target: { value: '2024' } });
    fireEvent.change(monthSelect, { target: { value: '6' } });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      year: 2024,
      month: 6,
    });
  });
});
