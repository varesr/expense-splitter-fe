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
    source: 'Amex',
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT',
    cardMember: 'Chris',
    accountNumber: '-5678',
    amount: -50.0,
    source: 'Amex',
  },
  {
    date: '17/01/2025',
    description: 'UTILITIES',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -200.0,
    source: 'Amex',
  },
];

/**
 * Sets up the useExpenseSelections mock.
 * `getSelection` maps a transaction to a PaidBy value (defaults to 'Roland').
 */
function setupExpenseSelectionsMock(
  getSelection: (t: Transaction) => PaidBy = () => 'Roland',
  overrides: Partial<ReturnType<typeof useExpenseSelections>> = {}
) {
  const mockSetSelection = vi.fn();
  const mockClearError = vi.fn();
  mockedUseExpenseSelections.mockReturnValue({
    getSelectionForTransaction: vi.fn(getSelection),
    setSelectionForTransaction: mockSetSelection,
    error: null,
    clearError: mockClearError,
    ...overrides,
  });
  return { mockSetSelection, mockClearError };
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
          source: 'Amex',
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

  it('does not display summary table before filter is submitted', () => {
    render(<TransactionsPage />, { wrapper: createWrapper() });

    expect(screen.queryByTestId('summary-table')).not.toBeInTheDocument();
  });

  it('displays summary table with source breakdown when transactions are loaded', async () => {
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
    });

    // Summary table should have All row and source rows
    const summaryTable = screen.getByTestId('summary-table');
    expect(summaryTable).toHaveTextContent('All');
    expect(summaryTable).toHaveTextContent('Amex');
  });

  it('calculates correct totals when all transactions default to Roland', async () => {
    setupExpenseSelectionsMock(() => 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
    });

    // Total: |-100| + |-50| + |-200| = 350 displayed as £350.00
    // £350.00 appears in All row Total and All row Roland columns, and in Amex row
    expect(screen.getAllByText('£350.00').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('£0.00').length).toBeGreaterThanOrEqual(1);
  });

  it('calls setSelectionForTransaction when changing Paid By to Chris', async () => {
    const { mockSetSelection } = setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
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
        source: 'Amex',
      },
    ];

    setupExpenseSelectionsMock(() => 'Split');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(singleTransaction));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      const amounts = screen.getAllByText('£50.00');
      expect(amounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not display summary table when no transactions', async () => {
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess([]));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
    });

    expect(screen.queryByTestId('summary-table')).not.toBeInTheDocument();
  });

  it('does not display summary table while loading', async () => {
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
      expect(screen.queryByTestId('summary-table')).not.toBeInTheDocument();
    });
  });
});

describe('TransactionsPage Table Columns', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('displays Source column in transaction table', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map(h => h.textContent);
      expect(headerTexts).toContain('Source');
    });
  });

  it('does not display Card Member or Account columns', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map(h => h.textContent);
      expect(headerTexts).not.toContain('Card Member');
      expect(headerTexts).not.toContain('Account');
    });
  });

  it('shows Custom source last in summary breakdown', async () => {
    const mixedTransactions: Transaction[] = [
      { date: '15/01/2025', description: 'STORE', amount: -100.0, source: 'Amex', cardMember: 'Roland', accountNumber: '-1234' },
      { date: '16/01/2025', description: 'Custom item', amount: 50.0, source: 'Custom' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mixedTransactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
    });

    const table = screen.getByTestId('summary-table');
    const rows = table.querySelectorAll('tbody tr');
    // Row 0 = All, Row 1 = Amex, Row 2 = Custom (Custom last)
    expect(rows.length).toBe(3);
    expect(rows[1].textContent).toContain('Amex');
    expect(rows[2].textContent).toContain('Custom');
  });
});

describe('TransactionsPage Add Transaction Button', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsReturn());
  });

  it('displays Add Transaction button', () => {
    render(<TransactionsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });
});

describe('TransactionsPage Save Error Toast', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('displays toast when save error occurs', () => {
    setupExpenseSelectionsMock(() => 'Roland', {
      error: 'Failed to save selection. Please try again.',
    });
    mockedUseTransactions.mockReturnValue(mockTransactionsReturn());

    render(<TransactionsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to save selection. Please try again.')).toBeInTheDocument();
  });

  it('does not display toast when there is no save error', () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsReturn());

    render(<TransactionsPage />, { wrapper: createWrapper() });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls clearError when toast is dismissed', () => {
    const { mockClearError } = setupExpenseSelectionsMock(() => 'Roland', {
      error: 'Failed to save selection. Please try again.',
    });
    mockedUseTransactions.mockReturnValue(mockTransactionsReturn());

    render(<TransactionsPage />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(mockClearError).toHaveBeenCalledOnce();
  });
});
