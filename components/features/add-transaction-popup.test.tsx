import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTransactionPopup } from './add-transaction-popup';
import { useCurrentUser } from '@/hooks/use-auth';
import { transactionService } from '@/services/transaction-service';

vi.mock('@/hooks/use-auth');
vi.mock('@/services/transaction-service', () => ({
  transactionService: {
    saveTransaction: vi.fn(),
  },
}));

const mockedUseCurrentUser = vi.mocked(useCurrentUser);
const mockedSaveTransaction = vi.mocked(transactionService.saveTransaction);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('AddTransactionPopup', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockedUseCurrentUser.mockReturnValue({
      data: { displayName: 'Roland' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useCurrentUser>);
    mockedSaveTransaction.mockResolvedValue(undefined);
  });

  it('renders form with date, amount, description, and paidBy fields', () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Paid By')).toBeInTheDocument();
  });

  it('defaults date to today', () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(dateInput.value).toBe(expected);
  });

  it('defaults paidBy to logged-in user display name', () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    const paidBySelect = screen.getByLabelText('Paid By') as HTMLSelectElement;
    expect(paidBySelect.value).toBe('Roland');
  });

  it('calls saveTransaction API on Add button click with correct data', async () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-15' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '34.20' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Grocery Shopping' } });
    fireEvent.change(screen.getByLabelText('Paid By'), { target: { value: 'Chris' } });

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockedSaveTransaction).toHaveBeenCalledWith({
        day: '15',
        month: '03',
        year: '2026',
        description: 'Grocery Shopping',
        amount: '34.20',
        paidBy: 'Chris',
      });
    });
  });

  it('closes popup on successful save', async () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10.00' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test' } });

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error message on failed save', async () => {
    mockedSaveTransaction.mockRejectedValue(new Error('description must not be blank'));

    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10.00' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test' } });

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText('description must not be blank')).toBeInTheDocument();
    });

    // Popup should remain open
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes popup when close button is clicked without saving', () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByLabelText('Close'));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockedSaveTransaction).not.toHaveBeenCalled();
  });

  it('closes popup when Cancel button is clicked', () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockedSaveTransaction).not.toHaveBeenCalled();
  });

  it('validates that description is required', async () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10.00' } });
    // Leave description empty
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    expect(mockedSaveTransaction).not.toHaveBeenCalled();
  });

  it('validates amount is required', async () => {
    render(<AddTransactionPopup year={2026} month={3} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test' } });
    // Leave amount empty
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });

    expect(mockedSaveTransaction).not.toHaveBeenCalled();
  });
});
