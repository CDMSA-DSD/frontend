import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SettingsPage from "./page";

beforeEach(() => {
  localStorage.clear();

  (global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.endsWith("/me") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => ({ id: 1, email: "alice@example.com", firstname: "Alice", lastName: "Cooper", jobTitle: "Engineer" }), text: async () => "{}" } as any);
    }

    if (url.endsWith("/me") && method === "PUT") {
      return Promise.resolve({ ok: true, json: async () => ({ id: 1, email: "alice@example.com", firstname: "Alicia", lastName: "Cooper-Smith", jobTitle: "Lead" }), text: async () => "{}" } as any);
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

test("renders profile fields after loading", async () => {
  render(<SettingsPage />);

  await waitFor(() => expect(screen.getByText(/Settings/i)).toBeInTheDocument());

  expect(screen.getByDisplayValue(/alice@example.com/i)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/Alice/)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/Cooper/)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/Engineer/)).toBeInTheDocument();
});

test("saves changes and shows success message", async () => {
  render(<SettingsPage />);

  await waitFor(() => expect(screen.getByDisplayValue(/Alice/)).toBeInTheDocument());

  const first = screen.getByDisplayValue(/Alice/);
  const last = screen.getByDisplayValue(/Cooper/);
  const role = screen.getByDisplayValue(/Engineer/);

  await userEvent.clear(first);
  await userEvent.type(first, "Alicia");
  await userEvent.clear(last);
  await userEvent.type(last, "Cooper-Smith");
  await userEvent.clear(role);
  await userEvent.type(role, "Lead");

  const saveBtn = screen.getByRole("button", { name: /Save changes/i });
  await userEvent.click(saveBtn);

  await waitFor(() => expect(screen.getByText(/Settings saved\./i)).toBeInTheDocument());

  const calls: any[] = (global as any).fetch.mock.calls;
  const hasPut = calls.some((c) => String(c[0]).includes("/me") && c[1]?.method === "PUT");
  expect(hasPut).toBe(true);
});

test("displays error when save fails", async () => {
  (global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.endsWith("/me") && method === "GET") return Promise.resolve({ ok: true, json: async () => ({ id: 2, email: "bob@example.com", firstname: "Bob", lastName: "B", jobTitle: "Dev" }), text: async () => "{}" } as any);
    if (url.endsWith("/me") && method === "PUT") return Promise.resolve({ ok: false, status: 500, statusText: "Internal", text: async () => "boom" } as any);
    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });

  render(<SettingsPage />);

  await waitFor(() => expect(screen.getByDisplayValue(/Bob/)).toBeInTheDocument());

  const saveBtn = screen.getByRole("button", { name: /Save changes/i });
  await userEvent.click(saveBtn);

  await waitFor(() => expect(screen.getByText(/PUT \/me 500/i)).toBeInTheDocument());
});
