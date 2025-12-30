import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/app/(authed)/sidebar';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Sidebar', () => {
  const mockPush = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  describe('Rendering', () => {
    it('renders the sidebar with logo', () => {
      render(<Sidebar />);
      expect(screen.getByLabelText('Sidebar')).toBeInTheDocument();
    });

    it('renders main navigation items', () => {
      render(<Sidebar />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('RFC')).toBeInTheDocument();
      expect(screen.getByText('ADR')).toBeInTheDocument();
    });

    it('renders settings and logout buttons', () => {
      render(<Sidebar />);
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Logout')).toBeInTheDocument();
    });
  });

  describe('Visibility and Overlay', () => {
    it('applies correct classes when open', () => {
      render(<Sidebar open={true} />);
      const sidebar = screen.getByLabelText('Sidebar');
      expect(sidebar).toHaveClass('translate-x-0');
      expect(sidebar).not.toHaveClass('-translate-x-full');
    });

    it('applies correct classes when closed', () => {
      render(<Sidebar open={false} />);
      const sidebar = screen.getByLabelText('Sidebar');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('renders overlay when open on mobile', () => {
      render(<Sidebar open={true} onClose={mockOnClose} />);
      const overlay = screen.getByLabelText('Close sidebar overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render overlay when closed', () => {
      render(<Sidebar open={false} />);
      expect(screen.queryByLabelText('Close sidebar overlay')).not.toBeInTheDocument();
    });

    it('calls onClose when overlay is clicked', () => {
      render(<Sidebar open={true} onClose={mockOnClose} />);
      const overlay = screen.getByLabelText('Close sidebar overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('highlights active navigation item', () => {
      (usePathname as jest.Mock).mockReturnValue('/rfc');
      render(<Sidebar />);
      const rfcLink = screen.getByText('RFC').closest('a');
      expect(rfcLink).toHaveClass('bg-[#C5B8E0]', 'text-gray-900');
    });

    it('does not highlight inactive navigation items', () => {
      (usePathname as jest.Mock).mockReturnValue('/dashboard');
      render(<Sidebar />);
      const rfcLink = screen.getByText('RFC').closest('a');
      expect(rfcLink).toHaveClass('text-gray-700', 'hover:bg-[#D4CBEB]');
      expect(rfcLink).not.toHaveClass('bg-[#C5B8E0]');
    });

    it('calls onClose when navigation link is clicked', () => {
      render(<Sidebar onClose={mockOnClose} />);
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when settings link is clicked', () => {
      render(<Sidebar onClose={mockOnClose} />);
      const settingsLink = screen.getByLabelText('Open settings');
      fireEvent.click(settingsLink);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication and Admin Features', () => {
    it('shows all admin navigation for admin users', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ isAdmin: true, contextIsAdmin: [] })
      );

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
        expect(screen.getByText('Manage Contexts')).toBeInTheDocument();
        expect(screen.getByText('Manage Organization')).toBeInTheDocument();
      });
    });

    it('shows "View Users" for non-admin users', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ isAdmin: false, contextIsAdmin: [] })
      );

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('View Users')).toBeInTheDocument();
        expect(screen.queryByText('Manage Users')).not.toBeInTheDocument();
      });
    });

    it('shows "Manage Contexts" for context admins', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ isAdmin: false, contextIsAdmin: ['context1'] })
      );

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Manage Contexts')).toBeInTheDocument();
      });
    });

    it('hides "Manage Organization" for non-admin users', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ isAdmin: false, contextIsAdmin: [] })
      );

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.queryByText('Manage Organization')).not.toBeInTheDocument();
      });
    });

    it('handles missing auth data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('View Users')).toBeInTheDocument();
      });
    });

    it('handles malformed auth data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('View Users')).toBeInTheDocument();
      });
    });

    it('handles undefined contextIsAdmin', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ isAdmin: false })
      );

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('View Contexts')).toBeInTheDocument();
      });
    });
  });

  describe('Logout Functionality', () => {
    it('removes auth from localStorage and redirects on logout', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ isAdmin: true })
      );

      render(<Sidebar />);

      const logoutButton = screen.getByLabelText('Logout');
      fireEvent.click(logoutButton);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('handles localStorage errors during logout gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(<Sidebar />);

      const logoutButton = screen.getByLabelText('Logout');
      
      expect(() => fireEvent.click(logoutButton)).not.toThrow();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Server-Side Rendering', () => {
    it('handles undefined window during SSR', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(() => render(<Sidebar />)).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Sidebar />);
      expect(screen.getByLabelText('Sidebar')).toBeInTheDocument();
      expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Logout')).toBeInTheDocument();
    });

    it('logout button is focusable', () => {
      render(<Sidebar />);
      const logoutButton = screen.getByLabelText('Logout');
      logoutButton.focus();
      expect(logoutButton).toHaveFocus();
    });
  });
});