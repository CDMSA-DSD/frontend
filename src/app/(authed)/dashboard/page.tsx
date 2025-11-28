"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { AdrResponse, RfcResponse } from "@/lib/types";
import { authFetch } from "@/lib/fetcher";

function formatRelative(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hours ago`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function pickTimestamp<T extends { createdAt?: string; updatedAt?: string }>(
  x: T,
) {
  return x.createdAt ?? x.updatedAt ?? "";
}

function getRfcAuthor(rfc: RfcResponse): string | undefined {
  const anyRfc = rfc as any;
  return (
    anyRfc.authorName ??
    anyRfc.author ??
    anyRfc.createdBy ??
    anyRfc.owner ??
    undefined
  );
}

function getAdrAuthor(adr: AdrResponse): string | undefined {
  const anyAdr = adr as any;
  return (
    anyAdr.authorName ??
    anyAdr.author ??
    anyAdr.createdBy ??
    anyAdr.owner ??
    undefined
  );
}

type SearchItem = {
  id: number;
  type: "RFC" | "ADR";
  title: string;
  author?: string;
  createdAt?: string;
  href: string;
};

export default function DashboardPage() {
  const [rfcs, setRfcs] = useState<RfcResponse[]>([]);
  const [adrs, setAdrs] = useState<AdrResponse[]>([]);
  const [rfcsErr, setRfcsErr] = useState<string | null>(null);
  const [adrsErr, setAdrsErr] = useState<string | null>(null);
  const [loadingRfcs, setLoadingRfcs] = useState(true);
  const [loadingAdrs, setLoadingAdrs] = useState(true);

  // US-28 search state
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    // Fetch RFCs
    (async () => {
      setLoadingRfcs(true);
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs`,
        );
        if (!res.ok) {
          const txt = await res.text();
          setRfcsErr(`Failed to load RFCs: ${res.status} ${txt}`);
          setRfcs([]);
        } else {
          const json = await res.json();
          setRfcs((json?.content as RfcResponse[]) ?? []);
          setRfcsErr(null);
        }
      } catch (err: any) {
        setRfcsErr(err?.message ?? String(err));
        setRfcs([]);
      } finally {
        setLoadingRfcs(false);
      }
    })();

    // Fetch ADRs
    (async () => {
      setLoadingAdrs(true);
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs`,
        );
        if (!res.ok) {
          const txt = await res.text();
          setAdrsErr(`Failed to load ADRs: ${res.status} ${txt}`);
          setAdrs([]);
        } else {
          const json = await res.json();
          setAdrs((json?.content as AdrResponse[]) ?? []); 
          setAdrsErr(null);
        }
      } catch (err: any) {
        setAdrsErr(err?.message ?? String(err));
        setAdrs([]);
      } finally {
        setLoadingAdrs(false);
      }
    })();
  }, []);

  const searchItems: SearchItem[] = useMemo(() => {
    const rfcItems: SearchItem[] = rfcs.map((rfc) => ({
      id: rfc.id as number,
      type: "RFC",
      title: (rfc as any).title ?? "",
      author: getRfcAuthor(rfc),
      createdAt: pickTimestamp(rfc),
      href: `/rfc/${rfc.id}`,
    }));

    const adrItems: SearchItem[] = adrs.map((adr) => ({
      id: adr.id as number,
      type: "ADR",
      title: (adr as any).title ?? "",
      author: getAdrAuthor(adr),
      createdAt: pickTimestamp(adr),
      href: `/adr/${adr.id}`,
    }));

    return [...rfcItems, ...adrItems];
  }, [rfcs, adrs]);

  const authorOptions = useMemo(() => {
    const set = new Set<string>();
    searchItems.forEach((item) => {
      if (item.author) {
        set.add(item.author);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [searchItems]);

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    return searchItems.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q)) {
        return false;
      }

      if (authorFilter && item.author !== authorFilter) {
        return false;
      }

      if (item.createdAt) {
        const created = new Date(item.createdAt);
        if (fromDate && created < fromDate) {
          return false;
        }
        if (toDate) {
          const toInclusive = new Date(toDate);
          toInclusive.setHours(23, 59, 59, 999);
          if (created > toInclusive) {
            return false;
          }
        }
      }

      return true;
    });
  }, [searchItems, searchQuery, authorFilter, dateFrom, dateTo]);

  const hasActiveSearch =
    searchQuery.trim() !== "" || authorFilter || dateFrom || dateTo;

  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Welcome</h1>

      {/* US-28: Search + filters */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Search RFCs and ADRs
        </h2>

        {/* search bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
          <input
            type="text"
            placeholder="Search by title…"
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-all duration-150"
            onClick={() => {
              setSearchQuery("");
              setAuthorFilter("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </button>
        </div>

        {/* filters: author + date range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Author filter */}
          <div className="flex flex-col text-sm">
            <label className="mb-1 text-gray-600">Author</label>

            <div className="relative group">
              <select
                className="
                  w-full appearance-none
                  px-4 py-2.5
                  bg-white
                  border
                  border-gray-300
                  rounded-xl
                  text-sm
                  shadow-sm
                  transition-all duration-150
                  focus:outline-none
                  focus:ring-2 focus:ring-purple-500
                  focus:border-purple-500
                  group-hover:border-gray-400
                "
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
              >
                <option value="">All authors</option>
                {authorOptions.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>

              {/* Arrow */}
              <div
                className="
                  pointer-events-none
                  absolute inset-y-0 right-3
                  flex items-center
                  text-gray-500
                  transition-opacity duration-200
                  group-hover:text-gray-700
                "
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M5 7L10 12L15 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Date from */}
          <div className="flex flex-col text-sm">
            <label className="mb-1 text-gray-600">From date</label>
            <div className="relative group">
              <input
                type="date"
                className="
                  w-full
                  px-4 py-2.5
                  bg-white
                  border
                  border-gray-300
                  rounded-xl
                  text-sm
                  shadow-sm
                  transition-all duration-150
                  focus:outline-none
                  focus:ring-2 focus:ring-purple-500
                  focus:border-purple-500
                  group-hover:border-gray-400
                "
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>

          {/* Date to */}
          <div className="flex flex-col text-sm">
            <label className="mb-1 text-gray-600">To date</label>
            <div className="relative group">
              <input
                type="date"
                className="
                  w-full
                  px-4 py-2.5
                  bg-white
                  border
                  border-gray-300
                  rounded-xl
                  text-sm
                  shadow-sm
                  transition-all duration-150
                  focus:outline-none
                  focus:ring-2 focus:ring-purple-500
                  focus:border-purple-500
                  group-hover:border-gray-400
                "
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* results list */}
        {hasActiveSearch && (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {filteredResults.length === 0 ? (
              <div className="py-3 text-sm text-gray-500">
                No matching RFCs or ADRs.
              </div>
            ) : (
              filteredResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.type}
                      {item.author ? ` • ${item.author}` : ""}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatRelative(item.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </Card>
        )}
      </section>

      {/* Recent RFCs */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent RFCs</h2>
          <Link
            href="/rfc"
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
          >
            View all &gt;
          </Link>
        </div>

        {rfcsErr ? (
          <p className="text-sm text-red-600">{rfcsErr}</p>
        ) : (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {loadingRfcs ? (
              <div className="py-3 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : rfcs.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">
                No RFCs yet.
              </div>
            ) : (
              rfcs.map((rfc) => (
                <Link
                  key={`rfc${rfc.id}`}
                  href={`/rfc/${rfc.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {(rfc as any).title}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatRelative(pickTimestamp(rfc))}
                  </span>
                </Link>
              ))
            )}
          </Card>
        )}
      </section>

      {/* Recent ADRs */}
      <section>
        <div className="flex items-center justify_between mb-4">
          <h2 className="text-2xl font-semibold">Recent ADRs</h2>
          <Link
            href="/adr"
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
          >
            View all &gt;
          </Link>
        </div>

        {adrsErr ? (
          <p className="text-sm text-red-600">{adrsErr}</p>
        ) : (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {loadingAdrs ? (
              <div className="py-3 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : adrs.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">
                No ADRs yet.
              </div>
            ) : (
              adrs.map((adr) => (
                <Link
                  key={`adr${adr.id}`}
                  href={`/adr/${adr.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {(adr as any).title}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatRelative(pickTimestamp(adr))}
                  </span>
                </Link>
              ))
            )}
          </Card>
        )}
      </section>
    </main>
  );
}
