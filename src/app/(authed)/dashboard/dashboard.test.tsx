import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";
import { authFetch } from "@/lib/fetcher";

jest.mock("@/lib/fetcher");
jest.mock("@/lib/api/chatbot");

const mockRfcs = {
  content: [
    { id: 1, title: "RFC One", status: "UNDER_REVIEW", createdAt: "2023-01-01T10:00:00Z" }
  ]
};

const mockAdrs = {
  content: [
    { id: 101, title: "ADR One", status: "APPROVED", createdAt: "2023-01-02T10:00:00Z" }
  ]
};

const mockUsers = {
  _embedded: {
    users: [
      { id: "user-1", firstname: "John", lastName: "Doe", email: "john@example.com" }
    ]
  }
};

const mockSearchResults = [
  { id: 1, type: "RFC", title: "Found RFC", authorName: "John Doe", date: "2023-01-01T10:00:00Z" }
];

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default success responses
    (authFetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/rfcs")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRfcs) });
      if (url.includes("/adrs")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAdrs) });
      if (url.includes("/users")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      if (url.includes("/search")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSearchResults) });
      return Promise.resolve({ ok: false });
    });
  });

  it("renders recent RFCs, ADRs and populates the author dropdown", async () => {
    render(<DashboardPage />);

    expect(screen.getAllByText(/Loading…/i)).toHaveLength(2);

    await waitFor(() => {
      expect(screen.getByText("RFC One")).toBeInTheDocument();
      expect(screen.getByText("ADR One")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("executes a search when clicking the search button", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    const searchInput = screen.getByPlaceholderText(/Search by keyword…/i);
    const searchButton = screen.getByRole("button", { name: /^Search$/i });

    await user.type(searchInput, "Test Query");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Found RFC")).toBeInTheDocument();
    });
    
    expect(authFetch).toHaveBeenCalledWith(expect.stringContaining("q=Test+Query"));
  });

  it("shows suggestions after typing (debounced)", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<DashboardPage />);

    const searchInput = screen.getByPlaceholderText(/Search by keyword…/i);
    await user.type(searchInput, "Suggestion");

    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      const suggestions = screen.getAllByText("Found RFC");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    jest.useRealTimers();
  });
});