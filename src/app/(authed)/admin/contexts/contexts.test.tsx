import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Contexts from "./page";

beforeEach(() => {
	localStorage.clear();

	(global as any).fetch = jest.fn((input: string | URL | Request) => {
		const url = String(input);

		if (url.includes("/me/contexts/admin")) {
			return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" } as any);
		}

		if (url.includes("/contexts")) {
			return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" } as any);
		}

		if (url.includes("/users")) {
			return Promise.resolve({ ok: true, json: async () => ({ _embedded: { users: [] } }), text: async () => "{}" } as any);
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

test("shows Manage header and Create button for admin users", async () => {
	localStorage.setItem("auth", JSON.stringify({ isAdmin: true, contextIsAdmin: [] }));

	render(<Contexts />);

	await waitFor(() => expect(screen.getByText(/Manage contexts here/i)).toBeInTheDocument());

	expect(screen.getByRole("button", { name: /Create context/i })).toBeInTheDocument();
});

test("shows View header and hides Create button for non-admin users", async () => {
	localStorage.setItem("auth", JSON.stringify({ isAdmin: false, contextIsAdmin: [] }));

	render(<Contexts />);

	await waitFor(() => expect(screen.getByText(/View contexts here/i)).toBeInTheDocument());

	expect(screen.queryByRole("button", { name: /Create context/i })).toBeNull();
});

test("opens NewContextModal when admin clicks Create context", async () => {
	localStorage.setItem("auth", JSON.stringify({ isAdmin: true, contextIsAdmin: [] }));

	render(<Contexts />);

	const createBtn = await waitFor(() => screen.getByRole("button", { name: /Create context/i }));
	await userEvent.click(createBtn);

	await waitFor(() => expect(screen.getByText(/New context/i)).toBeInTheDocument());
});

test("shows Manage header when user is context admin", async () => {
	localStorage.setItem("auth", JSON.stringify({ isAdmin: false, contextIsAdmin: [{ contextId: 1, name: "Test" }] }));

	render(<Contexts />);

	await waitFor(() => expect(screen.getByText(/Manage contexts here/i)).toBeInTheDocument());
});

test("renders a context item when contexts API returns items", async () => {
	localStorage.setItem("auth", JSON.stringify({ isAdmin: true, contextIsAdmin: [] }));

	(global as any).fetch = jest.fn((input: RequestInfo) => {
		const url = String(input);
		if (url.includes("/me/contexts/admin")) return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" } as any);
		if (url.includes("/contexts")) {
			const ctx = [{ id: 123, organizationId: 0, name: "MyContext", type: "", description: "" }];
			return Promise.resolve({ ok: true, json: async () => ctx, text: async () => JSON.stringify(ctx) } as any);
		}
		if (url.includes("/users")) return Promise.resolve({ ok: true, json: async () => ({ _embedded: { users: [] } }), text: async () => "{}" } as any);
		return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
	});

	render(<Contexts />);

	await waitFor(() => expect(screen.getByText(/MyContext/i)).toBeInTheDocument());
});

test("fetches members when a context is expanded", async () => {
	localStorage.setItem("auth", JSON.stringify({ isAdmin: true, contextIsAdmin: [] }));

	const ctx = { id: 123, organizationId: 0, name: "ExpandableContext", type: "", description: "" };

	(global as any).fetch = jest.fn((input: RequestInfo) => {
		const url = String(input);
		if (url.includes("/me/contexts/admin")) return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" } as any);
		if (url.includes("/contexts?page=0")) return Promise.resolve({ ok: true, json: async () => [ctx], text: async () => JSON.stringify([ctx]) } as any);
		if (url.includes(`/contexts/${ctx.id}/members`)) return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" } as any);
		if (url.includes("/users")) return Promise.resolve({ ok: true, json: async () => ({ _embedded: { users: [] } }), text: async () => "{}" } as any);
		return Promise.resolve({ ok: true, json: async () => ({}), text: async () => "{}" } as any);
	});

	render(<Contexts />);

	await waitFor(() => expect(screen.getByText(/ExpandableContext/i)).toBeInTheDocument());

	const summary = screen.getByText(/ExpandableContext/i);
	await userEvent.click(summary);

	const calls: any[] = (global as any).fetch.mock.calls;
	const hasMembersCall = calls.some((c) => String(c[0]).includes(`/contexts/${ctx.id}/members`));
	expect(hasMembersCall).toBe(true);
});
