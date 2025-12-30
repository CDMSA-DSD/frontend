import { render, screen, waitFor } from '@testing-library/react';
import ADRPage from './page';
import fetcher from '@/src/lib/fetcher';

jest.mock('@/lib/fetcher');
const mockedFetcher = fetcher as jest.MockedFunction<typeof fetcher>;

const mockAdrs = [
  {
    id: 1,
    title: 'Oldest Decision',
    context: 'Some context',
    status: 'APPROVED',
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: 2,
    title: 'Newest Decision',
    context: 'Recent context',
    status: 'DRAFT',
    createdAt: '2023-12-01T10:00:00Z',
  },
];

describe('ADRPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    // Return a promise that doesn't resolve immediately
    mockedFetcher.mockReturnValue(new Promise(() => {}));
    render(<ADRPage />);
    expect(screen.getByText(/Loading ADRs.../i)).toBeInTheDocument();
  });

  it('renders a list of ADRs sorted by date (newest first)', async () => {
    mockedFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ content: mockAdrs }),
    } as any);

    render(<ADRPage />);

    // Wait for the ADRs to appear
    await waitFor(() => {
      expect(screen.queryByText(/Loading ADRs.../i)).not.toBeInTheDocument();
    });

    const adrElements = screen.getAllByRole('heading', { level: 2 });
    
    // Check that both titles are there
    expect(screen.getByText('Newest Decision')).toBeInTheDocument();
    expect(screen.getByText('Oldest Decision')).toBeInTheDocument();

    // Verify Sorting: Index 0 should be the "Newest Decision"
    expect(adrElements[0]).toHaveTextContent('Newest Decision');
    expect(adrElements[1]).toHaveTextContent('Oldest Decision');
  });

  it('shows empty state message when no ADRs are returned', async () => {
    mockedFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [] }),
    } as any);

    render(<ADRPage />);

    await waitFor(() => {
      expect(screen.getByText(/No ADRs found/i)).toBeInTheDocument();
    });
  });

  it('displays an error message when the API fetch fails', async () => {
    mockedFetcher.mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    render(<ADRPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load ADRs/i)).toBeInTheDocument();
    });
  });

  it('links each ADR to its correct detail page', async () => {
    mockedFetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [mockAdrs[0]] }),
    } as any);

    render(<ADRPage />);

    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/adr/2');
  });
});