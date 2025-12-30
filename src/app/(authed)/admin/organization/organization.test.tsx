import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import OrganizationSettings from "./page";

beforeEach(() => {
  localStorage.clear();

  (global as any).fetch = jest.fn((input: RequestInfo) => {
    const url = String(input);

    if (url.includes("/orgs/github/repos")) {
      return Promise.resolve({ ok: true, json: async () => [{ name: "repo1", owner: "octo" }], text: async () => "[]" } as any);
    }

    if (url.endsWith("/orgs") || url.match(/\/orgs(\?|$)/)) {
      return Promise.resolve({ ok: true, json: async () => ({ companyName: "ACME Co", domain: "acme.com", description: "Acme", repoOwner: null, selectedRepoName: null, selectedBranchName: null }), text: async () => "{}" } as any);
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

test("renders organization details after loading", async () => {
  render(<OrganizationSettings />);

  await waitFor(() => expect(screen.getByDisplayValue(/ACME Co/i)).toBeInTheDocument());
  expect(screen.getByDisplayValue(/acme.com/i)).toBeInTheDocument();
});

test("shows GitHub connect UI when not connected", async () => {
  render(<OrganizationSettings />);

  await waitFor(() => expect(screen.getByText(/GitHub is not connected/i)).toBeInTheDocument());
  expect(screen.getByRole("button", { name: /Connect GitHub/i })).toBeInTheDocument();
});

test("shows connected UI when repoOwner present and calls repos endpoint on reload", async () => {
  (global as any).fetch = jest.fn((input: RequestInfo) => {
    const url = String(input);
    if (url.includes("/orgs/github/repos")) return Promise.resolve({ ok: true, json: async () => [{ name: "repo1", owner: "octo" }], text: async () => "[]" } as any);
    if (url.endsWith("/orgs") || url.match(/\/orgs(\?|$)/)) return Promise.resolve({ ok: true, json: async () => ({ companyName: "ACME Co", domain: "acme.com", description: "Acme", repoOwner: "octo", selectedRepoName: null, selectedBranchName: null }), text: async () => "{}" } as any);
    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });

  render(<OrganizationSettings />);

  await waitFor(() => expect(screen.getByText(/Connected as/i)).toBeInTheDocument());

  const reloadBtn = screen.getByRole("button", { name: /Reload/i });
  await userEvent.click(reloadBtn);

  const calls: any[] = (global as any).fetch.mock.calls;
  const hasReposCall = calls.some((c) => String(c[0]).includes("/orgs/github/repos"));
  expect(hasReposCall).toBe(true);
});

test("saves organization details on form submit", async () => {
  (global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.endsWith("/orgs") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => ({ companyName: "Old Co", domain: "old.com", description: "old" }), text: async () => "{}" } as any);
    }

    if (url.endsWith("/orgs") && method === "PUT") {
      return Promise.resolve({ ok: true, json: async () => ({ companyName: "New Co", domain: "new.com", description: "new" }), text: async () => "{}" } as any);
    }

    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });

  render(<OrganizationSettings />);

  await waitFor(() => expect(screen.getByDisplayValue(/Old Co/i)).toBeInTheDocument());

  const nameInput = screen.getByLabelText(/Company Name/i);
  const domainInput = screen.getByLabelText(/Domain/i);

  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "New Co");
  await userEvent.clear(domainInput);
  await userEvent.type(domainInput, "new.com");

  const saveBtn = screen.getByRole("button", { name: /Save Organization Details/i });
  await userEvent.click(saveBtn);

  await waitFor(() => expect(screen.getByText(/Organization details saved successfully./i)).toBeInTheDocument());

  const calls: any[] = (global as any).fetch.mock.calls;
  const hasPut = calls.some((c) => String(c[0]).includes("/orgs") && c[1]?.method === "PUT");
  expect(hasPut).toBe(true);
});

test("connects GitHub when token entered and Connect clicked", async () => {
  (global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.endsWith("/orgs") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => ({ companyName: "ACME Co", domain: "acme.com", repoOwner: null }), text: async () => "{}" } as any);
    }

    if (url.includes("/orgs/github") && method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }), text: async () => "{}" } as any);
    }

    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });

  render(<OrganizationSettings />);

  await waitFor(() => expect(screen.getByText(/GitHub is not connected/i)).toBeInTheDocument());

  const tokenInput = screen.getByPlaceholderText(/ghp_/i);
  await userEvent.type(tokenInput, "ghp_testtoken");

  const connectBtn = screen.getByRole("button", { name: /Connect GitHub/i });
  await userEvent.click(connectBtn);

  await waitFor(() => expect(screen.getByText(/GitHub connected with token./i)).toBeInTheDocument());

  const calls: any[] = (global as any).fetch.mock.calls;
  const hasPost = calls.some((c) => String(c[0]).includes("/orgs/github") && c[1]?.method === "POST");
  expect(hasPost).toBe(true);
});
