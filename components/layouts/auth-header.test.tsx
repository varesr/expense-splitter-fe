import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthHeader } from './auth-header';

const mockPush = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/services/auth-service', () => ({
  authService: {
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authService } from '@/services/auth-service';
const mockedMe = vi.mocked(authService.me);
const mockedLogout = vi.mocked(authService.logout);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('AuthHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
  });

  it('renders user display name when user data is loaded', async () => {
    mockedMe.mockResolvedValue({ displayName: 'Roland' });
    render(<AuthHeader />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Roland')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('does not show name while loading but shows Sign Out button', () => {
    mockedMe.mockImplementation(() => new Promise(() => {}));
    render(<AuthHeader />, { wrapper: createWrapper() });

    expect(screen.queryByText('Roland')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('hides display name on error but still shows Sign Out button', async () => {
    mockedMe.mockRejectedValue(new Error('Unauthorized'));
    render(<AuthHeader />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    });
    expect(screen.queryByText('Roland')).not.toBeInTheDocument();
  });

  it('does not render on login page', () => {
    mockPathname = '/login';
    mockedMe.mockResolvedValue({ displayName: 'Roland' });
    const { container } = render(<AuthHeader />, { wrapper: createWrapper() });

    expect(container.innerHTML).toBe('');
  });

  it('calls logout and redirects to login on Sign Out click', async () => {
    mockedMe.mockResolvedValue({ displayName: 'Roland' });
    mockedLogout.mockResolvedValue();
    const user = userEvent.setup();
    render(<AuthHeader />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    await waitFor(() => {
      expect(mockedLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
