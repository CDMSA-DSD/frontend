import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ push }),
}));

import AdrDetailPage from "./page";

const adrData = {
  id: 123,
  rfcId: 456,
  author: true,
  title: "My ADR Title",
  context: "Some context",
  decision: "We decided X",
  consequences: "Consequences",
  status: "DRAFT",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
};

const rfcData = {
  id: 456,
  title: "RFC Title",
  authorName: "Author",
  status: "OPEN",
  createdAt: "2025-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();

  (global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/adrs/123") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => adrData, text: async () => JSON.stringify(adrData) } as any);
    }

    if (url.includes("/rfcs/456") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => rfcData, text: async () => JSON.stringify(rfcData) } as any);
    }

    // PUT /adrs/123
    if (url.includes("/adrs/123") && method === "PUT") {
      return Promise.resolve({ ok: true, json: async () => ({ ...adrData, status: "APPROVED" }), text: async () => "{}" } as any);
    }

    if (url.includes("/adrs/publish") && method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }), text: async () => "{}" } as any);
    }

    if (url.includes("/adrs/123") && method === "DELETE") {
      return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
    }

    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  try {
    delete (global as any).fetch;
  } catch (e) {
    (global as any).fetch = undefined;
  }
});

test("renders ADR details and RFC link", async () => {
  render(<AdrDetailPage />);

  await waitFor(() => expect(screen.getByText(/My ADR Title/i)).toBeInTheDocument());
  expect(screen.getAllByRole("heading", { name: /Context/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("heading", { name: /Decision/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("heading", { name: /Consequences/i }).length).toBeGreaterThan(0);

  await waitFor(() => expect(screen.getByText(/RFC Title/i)).toBeInTheDocument());
});

test("opens Edit ADR modal when Edit button clicked", async () => {
  render(<AdrDetailPage />);

  await waitFor(() => expect(screen.getByText(/My ADR Title/i)).toBeInTheDocument());

  const editBtn = await waitFor(() => screen.getByTitle(/Edit ADR/i));
  await userEvent.click(editBtn);

  await waitFor(() => expect(screen.getByText(/Edit ADR/i)).toBeInTheDocument());
});

test("save via Edit ADR triggers PUT /adrs/:id", async () => {
  render(<AdrDetailPage />);

  await waitFor(() => expect(screen.getByText(/My ADR Title/i)).toBeInTheDocument());

  const editBtn = await waitFor(() => screen.getByTitle(/Edit ADR/i));
  await userEvent.click(editBtn);

  const saveBtn = await waitFor(() => screen.getByRole("button", { name: /Save/i }));
  await userEvent.click(saveBtn);

  const calls: any[] = (global as any).fetch.mock.calls;
  const hasPut = calls.some((c) => String(c[0]).includes("/adrs/123") && c[1]?.method === "PUT");
  expect(hasPut).toBe(true);
});

test("approve flow calls PUT and publish POST", async () => {
  render(<AdrDetailPage />);

  await waitFor(() => expect(screen.getByText(/My ADR Title/i)).toBeInTheDocument());

  const approveBtn = await waitFor(() => screen.getByTitle(/Approve/i));
  await userEvent.click(approveBtn);

  await waitFor(() => {
    const calls: any[] = (global as any).fetch.mock.calls;
    const hasPut = calls.some((c) => String(c[0]).includes("/adrs/123") && c[1]?.method === "PUT");
    const hasPublish = calls.some((c) => String(c[0]).includes("/adrs/publish") && c[1]?.method === "POST");
    expect(hasPut).toBe(true);
    expect(hasPublish).toBe(true);
  });
});

test("cancel flow deletes ADR and navigates back to RFC", async () => {
  render(<AdrDetailPage />);

  await waitFor(() => expect(screen.getByText(/My ADR Title/i)).toBeInTheDocument());

  const cancelBtn = await waitFor(() => screen.getByTitle(/Cancel ADR/i));
  await userEvent.click(cancelBtn);

  const confirmBtn = await waitFor(() => screen.getByRole("button", { name: /Yes, cancel ADR/i }));
  await userEvent.click(confirmBtn);

  await waitFor(() => {
    const calls: any[] = (global as any).fetch.mock.calls;
    const hasDelete = calls.some((c) => String(c[0]).includes("/adrs/123") && c[1]?.method === "DELETE");
    expect(hasDelete).toBe(true);
    expect(push).toHaveBeenCalledWith(`/rfc/${adrData.rfcId}`);
  });
});
