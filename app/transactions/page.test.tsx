import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionsPage from './page';
import { useTransactions } from '@/hooks/use-transactions';
import { useExpenseSelections } from '@/hooks/use-expense-selections';
import type { Transaction, PaidBy } from '@/types/transaction';

vi.mock('@/hooks/use-transactions');
vi.mock('@/hooks/use-expense-selections');
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockedUseTransactions = vi.mocked(useTransactions);
const mockedUseExpenseSelections = vi.mocked(useExpenseSelections);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Helper to build a mock return value for useTransactions with sensible defaults.
 */
function mockTransactionsReturn(
  overrides: Partial<ReturnType<typeof useTransactions>> = {}
): ReturnType<typeof useTransactions> {
  return {
    data: undefined,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
    isPending: true,
    isFetching: false,
    isRefetching: false,
    fetchStatus: 'idle',
    status: 'pending',
    refetch: vi.fn(),
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isStale: false,
    promise: Promise.resolve(undefined),
    ...overrides,
  } as ReturnType<typeof useTransactions>;
}

/** Helper to build a successful useTransactions return with data. */
function mockTransactionsSuccess(data: Transaction[]) {
  return mockTransactionsReturn({
    data,
    isSuccess: true,
    isPending: false,
    status: 'success',
    isFetched: true,
    isFetchedAfterMount: true,
    dataUpdatedAt: Date.now(),
    promise: Promise.resolve(data),
  });
}

const mockTransactionsData: Transaction[] = [
  {
    date: '15/01/2025',
    description: 'GROCERY STORE',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -100.0,
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT',
    cardMember: 'Chris',
    accountNumber: '-5678',
    amount: -50.0,
  },
  {
    date: '17/01/2025',
    description: 'UTILITIES',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -200.0,
  },
];

/**
 * Sets up the useExpenseSelections mock.
 * `getSelection` maps a transaction to a PaidBy value (defaults to 'Roland').
 */
function setupExpenseSelectionsMock(
  getSelection: (t: Transaction) => PaidBy = () => 'Roland'
) {
  const mockSetSelection = vi.fn();
  mockedUseExpenseSelections.mockReturnValue({
    getSelectionForTransaction: vi.fn(getSelection),
    setSelectionForTransaction: mockSetSelection,
  });
  return { mockSetSelection };
}

/** Submits the filter form with year/month. */
function submitFilter(year: string, month: string) {
  fireEvent.change(screen.getByLabelText('Year'), { target: { value: year } });
  fireEvent.change(screen.getByLabelText('Month'), { target: { value: month } });
  fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));
}

describe('TransactionsPage Date Formatting', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('displays dates with abbreviated day prefix', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(
      mockTransactionsSuccess([
        {
          date: '15/12/2025', // Monday
          description: 'TEST PURCHASE',
          cardMember: 'Roland',
          accountNumber: '-1234',
          amount: -50.0,
        },
      ])
    );

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '12');

    await waitFor(() => {
      expect(screen.getByText('Mon 15/12/2025')).toBeInTheDocument();
    });
  });
});

describe('TransactionsPage Summary Section', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsReturn());
  });

  it('does not display summary section before filter is submitted', () => {
    render(<TransactionsPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('Transactions Total')).not.toBeInTheDocument();
  });

  it('displays summary section when transactions are loaded', async () => {
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByText('Transactions Total')).toBeInTheDocument();
    });

    expect(screen.getByText("Roland's Total")).toBeInTheDocument();
    expect(screen.getByText("Chris's Total")).toBeInTheDocument();
  });

  it('calculates correct totals when all transactions default to Roland', async () => {
    setupExpenseSelectionsMock(() => 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByText('Transactions Total')).toBeInTheDocument();
    });

    // Total: |-100| + |-50| + |-200| = 350 displayed as £350.00
    const totalCards = screen.getAllByText(/£\d+\.\d{2}/);
    expect(totalCards.length).toBeGreaterThanOrEqual(3);

    // Verify specific totals: total=£350.00, roland=£350.00, chris=£0.00
    // £350.00 appears twice (Transactions Total and Roland's Total)
    expect(screen.getAllByText('£350.00')).toHaveLength(2);
    expect(screen.getByText('£0.00')).toBeInTheDocument();
  });

  it('calls setSelectionForTransaction when changing Paid By to Chris', async () => {
    const { mockSetSelection } = setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByText('Transactions Total')).toBeInTheDocument();
    });

    // Find the first row's toggle group and click the "Chris" button
    const toggleGroups = screen.getAllByRole('group');
    const firstRowToggle = toggleGroups[0];
    const chrisButton = firstRowToggle.querySelector('button:last-child');
    expect(chrisButton).toBeTruthy();
    fireEvent.click(chrisButton!);

    expect(mockSetSelection).toHaveBeenCalledWith(mockTransactionsData[0], 'Chris');
  });

  it('splits transaction equally between Roland and Chris when Split is selected', async () => {
    const singleTransaction: Transaction[] = [
      {
        date: '15/01/2025',
        description: 'SHARED EXPENSE',
        cardMember: 'Roland',
        accountNumber: '-1234',
        amount: -100.0,
      },
    ];

    // Start with Split already selected so totals reflect the split
    setupExpenseSelectionsMock(() => 'Split');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(singleTransaction));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    // After selecting Split for -100 transaction:
    // Roland's total = 50, Chris's total = 50
    await waitFor(() => {
      const amounts = screen.getAllByText('£50.00');
      expect(amounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not display summary section when no transactions', async () => {
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess([]));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Transactions Total')).not.toBeInTheDocument();
  });

  it('does not display summary section while loading', async () => {
    mockedUseTransactions.mockReturnValue(
      mockTransactionsReturn({
        isLoading: true,
        isPending: true,
        isFetching: true,
        fetchStatus: 'fetching',
        isInitialLoading: true,
      })
    );

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.queryByText('Transactions Total')).not.toBeInTheDocument();
    });
  });
});
