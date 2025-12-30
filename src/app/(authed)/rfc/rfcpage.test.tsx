import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import RFCPage from '@/app/(authed)/rfc/page';
import fetcher from '@/src/lib/fetcher';
import { parseDescription } from '@/lib/utils';

jest.mock('@/lib/fetcher');
const mockedFetcher = fetcher as jest.MockedFunction<typeof fetcher>;

jest.mock('@/components/ui/DrawIoEditorModal', () => {
  return function MockModal({ isOpen, onSave, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="drawio-mock">
        <button onClick={() => onSave('<xml>test</xml>')}>Save Diagram</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockRfcs = {
  content: [
    {
      id: 1,
      title: 'Test RFC',
      description: 'Context: Old System ---RFCSPLIT--- Problem: Too slow',
      authorName: 'John Doe',
      status: 'UNDER_REVIEW',
      createdAt: '2023-01-01T10:00:00Z',
      commentCount: 5,
    },
  ],
};

const mockUsers = {
  _embedded: {
    users: [{ id: 1, firstname: 'Alice', lastName: 'Smith', email: 'alice@test.com' }],
  },
};

const mockContexts = [
  { id: 101, name: 'Platform Team' }
];

describe('RFCPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8080';
  });

  it('renders the page and fetches RFCs on mount', async () => {
    mockedFetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRfcs,
    } as Response);

    render(<RFCPage />);

    expect(screen.getByText(/Loading RFCs.../i)).toBeInTheDocument();

    await waitFor(() => {
    expect(screen.getByText('Test RFC')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    mockedFetcher.mockRejectedValueOnce(new Error('API Down'));

    render(<RFCPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load RFCs/i)).toBeInTheDocument();
    });
  });

  it('opens the modal and loads reviewer data', async () => {
    mockedFetcher
      .mockResolvedValueOnce({ ok: true, json: async () => mockRfcs } as Response) // Initial load
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers } as Response) // Users
      .mockResolvedValueOnce({ ok: true, json: async () => mockContexts } as Response); // Contexts

    render(<RFCPage />);

    const newRfcBtn = screen.getByRole('button', { name: /New RFC/i });
    fireEvent.click(newRfcBtn);

    expect(screen.getByText('Create New RFC')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockedFetcher).toHaveBeenCalledWith(expect.stringContaining('/users'));
      expect(mockedFetcher).toHaveBeenCalledWith(expect.stringContaining('/contexts'));
    });
  });

  it('disables submit button until required fields are filled', async () => {
    mockedFetcher.mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    render(<RFCPage />);
    
    fireEvent.click(screen.getByRole('button', { name: /New RFC/i }));

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New RFC Title' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Context/i), { target: { value: 'Some context' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Problem Statement/i), { target: { value: 'The problem' } });
    
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits the form as multipart data', async () => {
    mockedFetcher.mockResolvedValue({ ok: true, json: async () => mockRfcs } as Response);
    
    render(<RFCPage />);
    fireEvent.click(screen.getByRole('button', { name: /New RFC/i }));

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Title' } });
    fireEvent.change(screen.getByLabelText(/Context/i), { target: { value: 'Ctx' } });
    fireEvent.change(screen.getByLabelText(/Problem Statement/i), { target: { value: 'Prob' } });

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const call = mockedFetcher.mock.calls.find(args => args[1]?.method === 'POST');
      expect(call).toBeDefined();
      expect(call![1]?.body).toBeInstanceOf(FormData);
    });
  });

  it('updates diagram XML when saved in DrawIoEditor', async () => {
    mockedFetcher.mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    render(<RFCPage />);
    
    fireEvent.click(screen.getByRole('button', { name: /New RFC/i }));
    
    fireEvent.click(screen.getByText(/Design Architecture Diagram/i));
    
    fireEvent.click(screen.getByText('Save Diagram'));

    expect(screen.getByText('Diagram added successfully')).toBeInTheDocument();
  });
});