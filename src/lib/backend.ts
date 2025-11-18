import { Page } from "./types";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

type FetchOpts = {
  path: string;
  init?: RequestInit;
};

async function fetchJson<T>({ path, init }: FetchOpts): Promise<T> {
  // Attach Authorization header with stored token when available (client-side only)
  let authHeader: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          authHeader = { Authorization: `Bearer ${parsed.token}` };
        }
      }
    } catch (e) {
      // ignore parsing errors
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": (init?.headers as Record<string, string>)?.["X-User-Id"] ?? "1",
      ...(init?.headers ?? {}),
      ...authHeader,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getRecentRfcs(limit = 4) {
  return fetchJson<Page<import("./types").RfcResponse>>({
    path: `/rfcs?page=0&size=${limit}&sort=createdAt,desc`,
  });
}

export async function getRecentAdrs(limit = 4) {
  return fetchJson<Page<import("./types").AdrResponse>>({
    path: `/adrs?page=0&size=${limit}&sort=createdAt,desc`,
  });
}

export async function getAdrById(id: number) {
  return fetchJson<import("./types").AdrResponse>({
    path: `/adrs/${id}`,
  });
}

