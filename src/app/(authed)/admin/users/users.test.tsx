import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UsersPage from "./page";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
  try {
    delete (global as any).fetch;
  } catch (e) {
    (global as any).fetch = undefined;
  }
});

test("shows manage header and invite button for admin", async () => {
  localStorage.setItem("auth", JSON.stringify({ isAdmin: true, contextIsAdmin: [] }));

  (global as any).fetch = jest.fn((input: RequestInfo) => {
    const url = String(input);
    if (url.includes("/users?page=0")) return Promise.resolve({ ok: true, json: async () => ({ _embedded: { users: [] } }), text: async () => "{}" } as any);
    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });

  render(<UsersPage />);

  await waitFor(() => expect(screen.getByText(/Manage the organization's users here/i)).toBeInTheDocument());

  expect(screen.getByPlaceholderText(/Search for a user/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Invite controls/i })).toBeInTheDocument();
});

test("does not show invite button for non-admin", async () => {
  localStorage.setItem("auth", JSON.stringify({ isAdmin: false, contextIsAdmin: [] }));

  (global as any).fetch = jest.fn((input: RequestInfo) => {
    return Promise.resolve({ ok: true, json: async () => ({ _embedded: { users: [] } }), text: async () => "{}" } as any);
  });

  render(<UsersPage />);

  await waitFor(() => expect(screen.getByText(/View the organization's users here/i)).toBeInTheDocument());

  expect(screen.queryByRole("button", { name: /Invite controls/i })).toBeNull();
});

test("opens invite modal and creates invitation (POST /invitations)", async () => {
  localStorage.setItem("auth", JSON.stringify({ isAdmin: true, contextIsAdmin: [] }));

  const mockFetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/users?page=0")) return Promise.resolve({ ok: true, json: async () => ({ _embedded: { users: [] } }), text: async () => "{}" } as any);
    if (url.includes("/invitations?size=50") && method === "GET") return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" } as any);
    if (url.includes("/invitations") && method === "POST") return Promise.resolve({ ok: true, json: async () => ({ id: 42, link: "https://example/invite/42", expiresAt: "", state: "ACTIVE" }), text: async () => "{}" } as any);

    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });

  (global as any).fetch = mockFetch;

  render(<UsersPage />);

  await waitFor(() => expect(screen.getByText(/Manage the organization's users here/i)).toBeInTheDocument());

  const inviteBtn = screen.getByRole("button", { name: /Invite controls/i });
  await userEvent.click(inviteBtn);

  await waitFor(() => expect(screen.getByRole("button", { name: /Create invitation link/i })).toBeInTheDocument());

  const createBtn = screen.getByRole("button", { name: /Create invitation link/i });
  await userEvent.click(createBtn);

  await waitFor(() => expect(screen.getByText(/Invitation link created successfully\./i)).toBeInTheDocument());

  const calls: any[] = mockFetch.mock.calls;
  const hasPost = calls.some((c) => String(c[0]).includes("/invitations") && c[1]?.method === "POST");
  expect(hasPost).toBe(true);
});
