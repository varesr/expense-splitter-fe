import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    amount: 100.0,
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT',
    cardMember: 'Chris',
    accountNumber: '-5678',
    amount: 50.0,
    source: 'Amex',
    originallyPaidBy: 'Roland',
  },
  {
    date: '17/01/2025',
    description: 'UTILITIES',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: 200.0,
    source: 'Amex',
    originallyPaidBy: 'Roland',
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
          amount: 50.0,
          source: 'Amex',
          originallyPaidBy: 'Roland',
        },
      ])
    );

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '12');

    await waitFor(() => {
      // Date is rendered in both the card and table views; assert within the table.
      const table = screen.getByTestId('transactions-table');
      expect(within(table).getByText('Mon 15/12/2025')).toBeInTheDocument();
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
    // Use Split so transactions appear in shared expenses summary
    setupExpenseSelectionsMock(() => 'Split');
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

  it('excludes non-shared expenses from summary when originallyPaidBy matches paidBy', async () => {
    setupExpenseSelectionsMock(() => 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
    });

    // All transactions have originallyPaidBy=Roland and paidBy=Roland
    // So all are excluded from shared expenses - totals should be £0.00
    const summaryTable = screen.getByTestId('summary-table');
    const allRow = summaryTable.querySelector('tbody tr');
    expect(allRow).toBeTruthy();
    expect(allRow!.textContent).toContain('£0.00');
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
    // Transactions are sorted by date descending, so first row is 17/01 (UTILITIES)
    const table = screen.getByTestId('transactions-table');
    const toggleGroups = within(table).getAllByRole('group');
    const firstRowToggle = toggleGroups[0];
    const chrisButton = firstRowToggle.querySelector('button:last-child');
    expect(chrisButton).toBeTruthy();
    fireEvent.click(chrisButton!);

    // First sorted transaction is the 17/01 one (mockTransactionsData[2] after sort)
    expect(mockSetSelection).toHaveBeenCalledWith(mockTransactionsData[2], 'Chris');
  });

  it('includes split transaction in shared expenses when originallyPaidBy differs from paidBy', async () => {
    const singleTransaction: Transaction[] = [
      {
        date: '15/01/2025',
        description: 'SHARED EXPENSE',
        cardMember: 'Roland',
        accountNumber: '-1234',
        amount: 100.0,
        source: 'Amex',
        originallyPaidBy: 'Roland',
      },
    ];

    setupExpenseSelectionsMock(() => 'Split');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(singleTransaction));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      // originallyPaidBy=Roland, paidBy=Split → shared expense
      // Total: £100.00, Paid by Roland: £100.00, Chris owes: £50.00
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
      expect(screen.getByTestId('balance-section')).toHaveTextContent('Chris still owes');
      expect(screen.getByTestId('balance-section')).toHaveTextContent('£50.00');
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
      { date: '15/01/2025', description: 'STORE', amount: 100.0, source: 'Amex', cardMember: 'Roland', accountNumber: '-1234', originallyPaidBy: 'Roland' },
      { date: '16/01/2025', description: 'Custom item', amount: 50.0, source: 'Custom', originallyPaidBy: 'Chris' },
    ];

    // Both marked as Split so they appear in shared expenses
    setupExpenseSelectionsMock(() => 'Split');
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

describe('TransactionsPage Mobile Card View', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders a card per transaction with all five fields', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('transactions-cards')).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId('transaction-card');
    expect(cards).toHaveLength(mockTransactionsData.length);

    // First sorted card is 17/01 (UTILITIES) — newest within Amex
    const firstCard = cards[0];
    expect(firstCard).toHaveTextContent('Fri 17/01/2025'); // date
    expect(firstCard).toHaveTextContent('UTILITIES'); // description
    expect(firstCard).toHaveTextContent('Amex'); // source
    expect(firstCard).toHaveTextContent('£200.00'); // amount
    // Paid By toggle (group role) present
    expect(within(firstCard).getByRole('group')).toBeInTheDocument();
  });

  it('clamps long descriptions to two lines in the card view', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('transactions-cards')).toBeInTheDocument();
    });

    const firstCard = screen.getAllByTestId('transaction-card')[0];
    const description = within(firstCard).getByText('UTILITIES');
    expect(description).toHaveClass('line-clamp-2');
  });

  it('fires setSelectionForTransaction when a card toggle segment is clicked', async () => {
    const { mockSetSelection } = setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('transactions-cards')).toBeInTheDocument();
    });

    const firstCard = screen.getAllByTestId('transaction-card')[0];
    fireEvent.click(within(firstCard).getByRole('button', { name: 'Chris' }));

    // First sorted transaction is the 17/01 one (mockTransactionsData[2] after sort)
    expect(mockSetSelection).toHaveBeenCalledWith(mockTransactionsData[2], 'Chris');
  });
});

describe('TransactionsPage Shared Expenses & Balance', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calculates shared expenses correctly matching the spec example', async () => {
    // From spec: Roland paid Amex A(20, Split), B(10, Split), E(10, Roland-discarded), F(30, Roland-discarded)
    //            Chris paid Custom C(10, Split), Roland paid Custom D(10, Chris)
    // Shared: A, B, C, D. Non-shared: E, F
    // Chris owes: 10+5+10=25, Roland owes: 5. Net: Chris owes 20
    const specTransactions: Transaction[] = [
      { date: '10/01/2025', description: 'Amex A', amount: 20.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
      { date: '12/01/2025', description: 'Amex B', amount: 10.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
      { date: '15/01/2025', description: 'Amex E', amount: 10.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Roland' },
      { date: '18/01/2025', description: 'Custom C', amount: 10.0, source: 'Custom', originallyPaidBy: 'Chris', paidBy: 'Split' },
      { date: '20/01/2025', description: 'Custom D', amount: 10.0, source: 'Custom', originallyPaidBy: 'Roland', paidBy: 'Chris' },
      { date: '22/01/2025', description: 'Amex F', amount: 30.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Roland' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(specTransactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('balance-section')).toBeInTheDocument();
    });

    // Chris owes £20.00
    expect(screen.getByTestId('balance-section')).toHaveTextContent('Chris still owes');
    expect(screen.getByTestId('balance-section')).toHaveTextContent('£20.00');
  });

  it('shows All settled when balance is zero', async () => {
    const balancedTransactions: Transaction[] = [
      { date: '10/01/2025', description: 'Roland pays', amount: 20.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
      { date: '12/01/2025', description: 'Chris pays', amount: 20.0, source: 'Custom', originallyPaidBy: 'Chris', paidBy: 'Split' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(balancedTransactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('balance-section')).toHaveTextContent('All settled');
    });
  });

  it('shows summary table headers with Paid by prefix', async () => {
    setupExpenseSelectionsMock(() => 'Split');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
    });

    const table = screen.getByTestId('summary-table');
    expect(table).toHaveTextContent('Paid by Roland');
    expect(table).toHaveTextContent('Paid by Chris');
  });
});

describe('TransactionsPage Negative Transactions (Refunds & Cashbacks)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('reduces Chris\'s debt when a Roland-paid Split transaction has a refund', async () => {
    // Roland charged £20 (Split) → Chris owes £10; refunded £5 (Split) → Chris's owe reduces by £2.50 → £7.50
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 20.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
      { date: '05/02/2026', description: 'Refund', amount: -5.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      expect(screen.getByTestId('balance-section')).toHaveTextContent('Chris still owes');
      expect(screen.getByTestId('balance-section')).toHaveTextContent('£7.50');
    });
  });

  it('reduces Roland\'s debt when a Chris-paid Split transaction has a refund', async () => {
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 20.0, source: 'Custom', originallyPaidBy: 'Chris', paidBy: 'Split' },
      { date: '05/02/2026', description: 'Refund', amount: -5.0, source: 'Custom', originallyPaidBy: 'Chris', paidBy: 'Split' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      expect(screen.getByTestId('balance-section')).toHaveTextContent('Roland still owes');
      expect(screen.getByTestId('balance-section')).toHaveTextContent('£7.50');
    });
  });

  it('reduces Chris\'s debt when a refund is assigned fully to Chris (originally Roland-paid)', async () => {
    // Charge fully assigned to Chris: Chris owes £20. Refund fully to Chris: -£10. Net: Chris owes £10.
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 20.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Chris' },
      { date: '05/02/2026', description: 'Refund', amount: -10.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Chris' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      expect(screen.getByTestId('balance-section')).toHaveTextContent('Chris still owes');
      expect(screen.getByTestId('balance-section')).toHaveTextContent('£10.00');
    });
  });

  it('flips balance direction when refunds exceed charges', async () => {
    // Roland-paid Split £4 → Chris owes £2. Refund £10 Split → Chris's owe drops to -£3. Flips: Roland owes £3.
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 4.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
      { date: '05/02/2026', description: 'Big refund', amount: -10.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      expect(screen.getByTestId('balance-section')).toHaveTextContent('Roland still owes');
      expect(screen.getByTestId('balance-section')).toHaveTextContent('£3.00');
    });
  });

  it('renders a negative amount as -£X.XX in the transaction row', async () => {
    const transactions: Transaction[] = [
      { date: '05/02/2026', description: 'Refund', amount: -5.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      // "-£5.00" appears in the summary totals AND in the transaction row
      const occurrences = screen.getAllByText('-£5.00');
      expect(occurrences.length).toBeGreaterThanOrEqual(1);
      // Specifically verify the transaction row (in a tbody row containing the description)
      const table = screen.getByTestId('transactions-table');
      const refundRow = within(table).getByText('Refund').closest('tr')!;
      expect(refundRow).toHaveTextContent('-£5.00');
    });
  });

  it('renders a negative source total with minus sign in the summary', async () => {
    // Refunds exceed charges for Amex: total goes negative
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 2.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
      { date: '05/02/2026', description: 'Big refund', amount: -5.0, source: 'Amex', originallyPaidBy: 'Roland', paidBy: 'Split' },
    ];

    setupExpenseSelectionsMock((t) => t.paidBy as PaidBy || 'Roland');
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      const summary = screen.getByTestId('summary-table');
      // Amex source row should show -£3.00 (2 + -5)
      expect(summary).toHaveTextContent('-£3.00');
    });
  });
});

describe('TransactionsPage Transaction Ordering', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('orders Custom transactions before Amex', async () => {
    const mixedTransactions: Transaction[] = [
      { date: '15/01/2025', description: 'Amex item', amount: 10.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '16/01/2025', description: 'Custom item', amount: 20.0, source: 'Custom', originallyPaidBy: 'Chris' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mixedTransactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      // Find toggle button groups in the table view - each transaction row has one
      const table = screen.getByTestId('transactions-table');
      const toggleGroups = within(table).getAllByRole('group');
      expect(toggleGroups).toHaveLength(2);

      // First row should be Custom item (Custom before Amex)
      const firstRowCells = toggleGroups[0].closest('tr')!;
      expect(firstRowCells).toHaveTextContent('Custom item');

      const secondRowCells = toggleGroups[1].closest('tr')!;
      expect(secondRowCells).toHaveTextContent('Amex item');
    });
  });

  it('orders transactions by date descending within same source', async () => {
    const transactions: Transaction[] = [
      { date: '10/01/2025', description: 'Oldest', amount: 10.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '20/01/2025', description: 'Newest', amount: 20.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '15/01/2025', description: 'Middle', amount: 15.0, source: 'Amex', originallyPaidBy: 'Roland' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      const table = screen.getByTestId('transactions-table');
      const toggleGroups = within(table).getAllByRole('group');
      expect(toggleGroups).toHaveLength(3);

      expect(toggleGroups[0].closest('tr')!).toHaveTextContent('Newest');
      expect(toggleGroups[1].closest('tr')!).toHaveTextContent('Middle');
      expect(toggleGroups[2].closest('tr')!).toHaveTextContent('Oldest');
    });
  });
});

describe('TransactionsPage Source Totals List', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders one row per distinct source with the gross summed amount', async () => {
    const transactions: Transaction[] = [
      { date: '15/01/2025', description: 'Charge 1', amount: 1000.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '16/01/2025', description: 'Charge 2', amount: 234.56, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '17/01/2025', description: 'Custom 1', amount: 678.9, source: 'Custom', originallyPaidBy: 'Chris' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('source-totals-list')).toBeInTheDocument();
    });

    const list = screen.getByTestId('source-totals-list');
    const items = list.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(list).toHaveTextContent('Amex');
    expect(list).toHaveTextContent('£1234.56');
    expect(list).toHaveTextContent('Custom');
    expect(list).toHaveTextContent('£678.90');
  });

  it('orders Custom first, then alphabetical', async () => {
    const transactions: Transaction[] = [
      { date: '15/01/2025', description: 'A1', amount: 10.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '16/01/2025', description: 'C1', amount: 20.0, source: 'Custom', originallyPaidBy: 'Chris' },
      { date: '17/01/2025', description: 'B1', amount: 30.0, source: 'Barclays', originallyPaidBy: 'Roland' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('source-totals-list')).toBeInTheDocument();
    });

    const items = screen.getByTestId('source-totals-list').querySelectorAll('li');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Custom');
    expect(items[1].textContent).toContain('Amex');
    expect(items[2].textContent).toContain('Barclays');
  });

  it('renders a negative net total in red', async () => {
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 5.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '05/02/2026', description: 'Big refund', amount: -20.0, source: 'Amex', originallyPaidBy: 'Roland' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      expect(screen.getByTestId('source-totals-list')).toBeInTheDocument();
    });

    const amountSpan = screen.getByTestId('source-totals-list').querySelector('li span:last-child');
    expect(amountSpan).toBeTruthy();
    expect(amountSpan!.textContent).toBe('-£15.00');
    expect(amountSpan!.className).toContain('text-red-600');
  });

  it('still renders a row for a source with a £0.00 net total', async () => {
    const transactions: Transaction[] = [
      { date: '02/02/2026', description: 'Charge', amount: 10.0, source: 'Amex', originallyPaidBy: 'Roland' },
      { date: '05/02/2026', description: 'Refund', amount: -10.0, source: 'Amex', originallyPaidBy: 'Roland' },
    ];

    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(transactions));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2026', '2');

    await waitFor(() => {
      expect(screen.getByTestId('source-totals-list')).toBeInTheDocument();
    });

    const list = screen.getByTestId('source-totals-list');
    const items = list.querySelectorAll('li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Amex');
    expect(items[0].textContent).toContain('£0.00');
  });

  it('no longer renders the "transaction(s) found" count line', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess(mockTransactionsData));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      expect(screen.getByTestId('source-totals-list')).toBeInTheDocument();
    });

    expect(screen.queryByText(/transaction\(s\) found/i)).not.toBeInTheDocument();
  });

  it('shows "Loading transactions..." while loading and hides the list', async () => {
    setupExpenseSelectionsMock();
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
      expect(screen.getByText(/loading transactions/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('source-totals-list')).not.toBeInTheDocument();
  });

  it('shows "No transactions" when result is empty and hides the list', async () => {
    setupExpenseSelectionsMock();
    mockedUseTransactions.mockReturnValue(mockTransactionsSuccess([]));

    render(<TransactionsPage />, { wrapper: createWrapper() });
    submitFilter('2025', '1');

    await waitFor(() => {
      // Header-level short message
      const headerArea = screen.getByText('Transactions for January 2025').parentElement!;
      expect(headerArea.textContent).toContain('No transactions');
    });
    expect(screen.queryByTestId('source-totals-list')).not.toBeInTheDocument();
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
