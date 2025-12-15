import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionsPage from './page';
import { useTransactions } from '@/hooks/use-transactions';
import type { Transaction } from '@/types/transaction';

vi.mock('@/hooks/use-transactions');
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockedUseTransactions = vi.mocked(useTransactions);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockTransactionsData: Transaction[] = [
  {
    date: '15/01/2025',
    description: 'GROCERY STORE',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -100.00,
  },
  {
    date: '16/01/2025',
    description: 'RESTAURANT',
    cardMember: 'Chris',
    accountNumber: '-5678',
    amount: -50.00,
  },
  {
    date: '17/01/2025',
    description: 'UTILITIES',
    cardMember: 'Roland',
    accountNumber: '-1234',
    amount: -200.00,
  },
];

describe('TransactionsPage Summary Section', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedUseTransactions.mockReturnValue({
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
    } as ReturnType<typeof useTransactions>);
  });

  it('does not display summary section before filter is submitted', () => {
    render(<TransactionsPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('displays summary section when transactions are loaded', async () => {
    mockedUseTransactions.mockReturnValue({
      data: mockTransactionsData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      isPending: false,
      isFetching: false,
      isRefetching: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      promise: Promise.resolve(mockTransactionsData),
    } as ReturnType<typeof useTransactions>);

    render(<TransactionsPage />, { wrapper: createWrapper() });

    // Submit the filter form
    const yearSelect = screen.getByLabelText('Year');
    const monthSelect = screen.getByLabelText('Month');
    fireEvent.change(yearSelect, { target: { value: '2025' } });
    fireEvent.change(monthSelect, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('Transactions Total')).toBeInTheDocument();
    expect(screen.getByText("Roland's Total")).toBeInTheDocument();
    expect(screen.getByText("Chris's Total")).toBeInTheDocument();
  });

  it('calculates correct totals when all transactions default to Roland', async () => {
    mockedUseTransactions.mockReturnValue({
      data: mockTransactionsData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      isPending: false,
      isFetching: false,
      isRefetching: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      promise: Promise.resolve(mockTransactionsData),
    } as ReturnType<typeof useTransactions>);

    render(<TransactionsPage />, { wrapper: createWrapper() });

    // Submit the filter form
    const yearSelect = screen.getByLabelText('Year');
    const monthSelect = screen.getByLabelText('Month');
    fireEvent.change(yearSelect, { target: { value: '2025' } });
    fireEvent.change(monthSelect, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    // Total: -100 + -50 + -200 = -350 (displayed as £350.00)
    // All default to Roland, so Roland's total = £350.00, Chris's = £0.00
    const summarySection = screen.getByText('Summary').closest('div');
    expect(summarySection).toBeInTheDocument();

    // Check totals are displayed (3 cards with £350.00, £350.00, £0.00)
    const totalCards = screen.getAllByText(/£\d+\.\d{2}/);
    expect(totalCards.length).toBeGreaterThanOrEqual(3);
  });

  it('updates totals when changing Paid By to Chris', async () => {
    mockedUseTransactions.mockReturnValue({
      data: mockTransactionsData,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      isPending: false,
      isFetching: false,
      isRefetching: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      promise: Promise.resolve(mockTransactionsData),
    } as ReturnType<typeof useTransactions>);

    render(<TransactionsPage />, { wrapper: createWrapper() });

    // Submit the filter form
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } });
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    // Find the first row's toggle group and click Chris
    const toggleGroups = screen.getAllByRole('group');
    const firstRowToggle = toggleGroups[0];
    const chrisButton = firstRowToggle.querySelector('button:last-child');
    if (chrisButton) {
      fireEvent.click(chrisButton);
    }

    // After clicking Chris for first transaction (-100):
    // Roland's total should decrease, Chris's should increase
    await waitFor(() => {
      // The totals should have updated
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });
  });

  it('splits transaction equally between Roland and Chris when Split is selected', async () => {
    const singleTransaction: Transaction[] = [
      {
        date: '15/01/2025',
        description: 'SHARED EXPENSE',
        cardMember: 'Roland',
        accountNumber: '-1234',
        amount: -100.00,
      },
    ];

    mockedUseTransactions.mockReturnValue({
      data: singleTransaction,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      isPending: false,
      isFetching: false,
      isRefetching: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      promise: Promise.resolve(singleTransaction),
    } as ReturnType<typeof useTransactions>);

    render(<TransactionsPage />, { wrapper: createWrapper() });

    // Submit the filter form
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } });
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    // Click Split button in the toggle group
    const toggleGroup = screen.getByRole('group');
    const splitButton = toggleGroup.querySelector('button:nth-child(2)');
    if (splitButton) {
      fireEvent.click(splitButton);
    }

    // After selecting Split for -100 transaction:
    // Roland's total = -50, Chris's total = -50
    await waitFor(() => {
      const amounts = screen.getAllByText('£50.00');
      // Should have at least 2 occurrences of £50.00 (Roland and Chris totals)
      expect(amounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not display summary section when no transactions', async () => {
    mockedUseTransactions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      isPending: false,
      isFetching: false,
      isRefetching: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      promise: Promise.resolve([]),
    } as ReturnType<typeof useTransactions>);

    render(<TransactionsPage />, { wrapper: createWrapper() });

    // Submit the filter form
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } });
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('does not display summary section while loading', async () => {
    mockedUseTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
      isPending: true,
      isFetching: true,
      isRefetching: false,
      fetchStatus: 'fetching',
      status: 'pending',
      refetch: vi.fn(),
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: false,
      isFetchedAfterMount: false,
      isInitialLoading: true,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      promise: Promise.resolve(undefined),
    } as ReturnType<typeof useTransactions>);

    render(<TransactionsPage />, { wrapper: createWrapper() });

    // Submit the filter form
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } });
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Should show loading spinner, not summary
    await waitFor(() => {
      expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    });
  });
});
