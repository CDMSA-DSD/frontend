import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "7" }) }));

import RFCDetailPage from "./page";

const rfcData = {
  id: 7,
  title: "RFC Alpha",
  description: "Context: Something ---RFCSPLIT--- Problem: Something else",
  userId: 1,
  authorName: "Alice",
  templateId: 1,
  orgId: 1,
  status: "UNDER_REVIEW",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
  isAuthor: true,
  isReviewer: true,
  alternatives: [
    {
      id: 1,
      title: "Alt 1",
      description: "This is an alternative description",
      pros: "pro1;pro2",
      cons: "con1;con2",
      authorId: 2,
      authorName: "Bob",
      createdAt: "2025-01-03T00:00:00Z",
      updatedAt: null,
      yes: 2,
      no: 1,
      addition: null,
    },
  ],
  comments: [],
  userReviewers: [],
  contextReviewers: [],
  isWatching: false,
  xml: null,
  attachments: [],
  addition: null,
};

const usersResp = { _embedded: { users: [] } };

beforeEach(() => {
  (global as any).fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/rfcs/7") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => rfcData, text: async () => JSON.stringify(rfcData) } as any);
    }

    if (url.includes("/users")) {
      return Promise.resolve({ ok: true, json: async () => usersResp, text: async () => JSON.stringify(usersResp) } as any);
    }

    if (url.includes("/rfcs/alternatives/1") && method === "GET") {
      return Promise.resolve({ ok: true, json: async () => ({ attachments: [], xml: '' }), text: async () => "{}" } as any);
    }

    if (url.includes("/rfcs/7/subscribe") && method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }), text: async () => "{}" } as any);
    }

    if (url.includes("/rfcs/7/comments") && method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ id: 99, content: init && init.body ? JSON.parse(String(init.body)).content : '' }), text: async () => "{}" } as any);
    }

    return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  try { delete (global as any).fetch } catch (e) { (global as any).fetch = undefined }
});

test("renders RFC title and description headings", async () => {
  render(<RFCDetailPage />);

  await waitFor(() => expect(screen.getByText(/RFC Alpha/i)).toBeInTheDocument());
  // check section headings instead of ambiguous text
  expect(screen.getByRole("heading", { name: /Context/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Problem/i })).toBeInTheDocument();
});

test("renders mapped alternative when Alternatives tab selected", async () => {
  render(<RFCDetailPage />);

  await waitFor(() => expect(screen.getByText(/RFC Alpha/i)).toBeInTheDocument());

  // click the Alternatives tab (button contains 'Alternatives')
  const altTab = screen.getByText(/Alternatives/i);
  altTab.click();

  await waitFor(() => expect(screen.getByText(/Alt 1/i)).toBeInTheDocument());
});

test("fetches RFC and users on load", async () => {
  render(<RFCDetailPage />);

  await waitFor(() => expect(screen.getByText(/RFC Alpha/i)).toBeInTheDocument());

  const calls: any[] = (global as any).fetch.mock.calls;
  const hasRfc = calls.some((c) => String(c[0]).includes("/rfcs/7"));
  const hasUsers = calls.some((c) => String(c[0]).includes("/users"));

  expect(hasRfc).toBe(true);
  expect(hasUsers).toBe(true);
});
