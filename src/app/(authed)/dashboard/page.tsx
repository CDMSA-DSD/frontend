"use client";

import React, { useEffect, useState } from "react";
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

  return date.toLocaleDateString("en-GB", {
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

type SearchResult = {
  id: number;
  type: "RFC" | "ADR";
  title: string;
  author?: string;
  createdAt?: string;
};

type UserOption = {
  id: string; // we use string, backend converts it to Long
  name: string;
};

export default function DashboardPage() {
  const [rfcs, setRfcs] = useState<RfcResponse[]>([]);
  const [adrs, setAdrs] = useState<AdrResponse[]>([]);
  const [rfcsErr, setRfcsErr] = useState<string | null>(null);
  const [adrsErr, setAdrsErr] = useState<string | null>(null);
  const [loadingRfcs, setLoadingRfcs] = useState(true);
  const [loadingAdrs, setLoadingAdrs] = useState(true);

  // US-28 search state (backend /search)
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<"relevance" | "date_desc" | "date_asc">(
    "relevance",
  );

  const [users, setUsers] = useState<UserOption[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // live suggestions
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Recent RFCs / ADRs
  useEffect(() => {
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
          const items = (json?.content as RfcResponse[]) ?? [];
          // Ensure RFCs are ordered newest -> oldest by createdAt
          items.sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
          setRfcs(items);
          setRfcsErr(null);
        }
      } catch (err: any) {
        setRfcsErr(err?.message ?? String(err));
        setRfcs([]);
      } finally {
        setLoadingRfcs(false);
      }
    })();

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
          const items = (json?.content as AdrResponse[]) ?? [];
          // Ensure ADRs are ordered newest -> oldest by createdAt
          items.sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
          setAdrs(items);
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

  // /users HATEOAS: _embedded.users[]
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
        );
        if (!res.ok) {
          console.error("Failed to load users:", res.status);
          return;
        }
        const json = await res.json();

        let raw: any[] = [];
        if (json?._embedded?.users && Array.isArray(json._embedded.users)) {
          raw = json._embedded.users;
        } else if (Array.isArray(json)) {
          raw = json;
        }

        const mapped: UserOption[] = raw.map((wrapper: any) => {
          // PagedModel<EntityModel<UserResponse>> => each element in _embedded.users is { id, firstname, lastName, email, joinedAt, _links... }
          const u = wrapper;
          const fullName = [u.firstname, u.lastName].filter(Boolean).join(" ");
          const name = fullName || u.email || `User #${u.id ?? "?"}`;
          return {
            id: String(u.id),
            name,
          };
        });

        setUsers(mapped);
      } catch (e) {
        console.error("Error loading users for author dropdown:", e);
      }
    })();
  }, []);

  // helper: map backend SearchResult DTO -> frontend type
  function mapSearchResultItem(item: any): SearchResult {
    const typeRaw = (item.type ?? "").toString().toUpperCase();
    const type: "RFC" | "ADR" = typeRaw === "ADR" ? "ADR" : "RFC";

    return {
      id: item.id,
      type,
      title: item.title ?? "(untitled)",
      author: item.authorName ?? undefined,
      createdAt: item.date ?? undefined,
    };
  }

  // main search (on "Search" click)
  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchError("Please enter a keyword to search.");
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      setHasSearched(true);

      const params = new URLSearchParams();
      params.set("q", q);
      params.set("sort", sort); // matches backend: relevance | date_desc | date_asc
      if (authorFilter) params.set("authorId", authorFilter);
      if (dateFrom) params.set("dateFrom", dateFrom); // YYYY-MM-DD
      if (dateTo) params.set("dateTo", dateTo);       // YYYY-MM-DD

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/search?${params.toString()}`;
      console.log("SEARCH URL:", url);

      const res = await authFetch(url);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Search failed: ${res.status} ${txt}`);
      }

      const json = await res.json();
      const raw: any[] = Array.isArray(json) ? json : json ?? [];
      const mapped: SearchResult[] = raw.map(mapSearchResultItem);

      // No extra local date/sort logic – backend handles it
      setSearchResults(mapped);
    } catch (e: any) {
      setSearchError(e?.message ?? "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // auto-refresh search when filters / sort change, if query already exists
  useEffect(() => {
    if (!hasSearched) return;
    if (!searchQuery.trim()) return;
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorFilter, dateFrom, dateTo, sort]);

  const handleClear = () => {
    setSearchQuery("");
    setAuthorFilter("");
    setDateFrom("");
    setDateTo("");
    setSort("relevance");
    setSearchResults([]);
    setSearchError(null);
    setHasSearched(false);
    setSuggestions([]);
  };

  // live suggestions (debounced) – uses the same /search endpoint
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);

        const params = new URLSearchParams();
        params.set("q", q);
        params.set("sort", sort); 
        if (authorFilter) params.set("authorId", authorFilter);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/search?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          setSuggestions([]);
          return;
        }

        const json = await res.json();
        const raw: any[] = Array.isArray(json) ? json : json ?? [];
        const mapped: SearchResult[] = raw.map(mapSearchResultItem);
        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [searchQuery, authorFilter, dateFrom, dateTo, sort]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Welcome</h1>

      {/* Search + filters */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Search RFCs and ADRs
        </h2>

        {/* search bar + buttons */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by keyword…"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setSearchError(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  runSearch();
                  setShowSuggestions(false);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150);
              }}
            />

            {showSuggestions && (searchQuery.trim() || suggestionsLoading) && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {suggestionsLoading && (
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Searching…
                  </div>
                )}

                {!suggestionsLoading && suggestions.length === 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500">
                    No suggestions.
                  </div>
                )}

                {!suggestionsLoading &&
                  suggestions.slice(0, 8).map((item) => (
                    <Link
                      key={`suggest-${item.type}-${item.id}`}
                      href={item.type === "ADR" ? `/adr/${item.id}` : `/rfc/${item.id}`}
                      className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.type}
                          {item.author ? ` • ${item.author}` : ""}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatRelative(item.createdAt)}
                      </span>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-all duration-150"
              onClick={() => {
                handleClear();
                setShowSuggestions(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-sm text-white shadow-sm hover:bg-purple-700 transition-all duration-150 disabled:bg-purple-300 disabled:cursor-not-allowed"
              onClick={() => {
                runSearch();
                setShowSuggestions(false);
              }}
              disabled={searchLoading}
            >
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        {/* filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Author */}
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
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
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
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
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

          {/* From date */}
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

          {/* To date */}
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

          {/* Order by */}
          <div className="flex flex-col text-sm">
            <label className="mb-1 text-gray-600">Order by</label>
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
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "relevance" | "date_desc" | "date_asc")
                }
              >
                <option value="relevance">Relevance</option>
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
              </select>

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
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
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
        </div>

        {/* results list */}
        {hasSearched && (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {searchLoading ? (
              <div className="py-3 text-sm text-gray-500">Searching…</div>
            ) : searchError ? (
              <div className="py-3 text-sm text-red-500">{searchError}</div>
            ) : searchResults.length === 0 ? (
              <div className="py-3 text-sm text-gray-500">
                No matching RFCs or ADRs.
              </div>
            ) : (
              searchResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.type === "ADR" ? `/adr/${item.id}` : `/rfc/${item.id}`}
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
          <h2 className="text-2xl font-semibold text-gray-700">Recent RFCs</h2>
          <Link href="/rfc" className="text-sm text-purple-600 hover:text-purple-700 hover:underline">
            View all &gt;
          </Link>
        </div>

        {rfcsErr ? (
          <p className="text-sm text-red-600">{rfcsErr}</p>
        ) : (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {loadingRfcs ? (
              <div className="py-3 text-sm ">Loading…</div>
            ) : rfcs.length === 0 ? (
              <div className="py-3 text-sm ">No RFCs yet.</div>
            ) : (
              rfcs.map((rfc) => (
                <Link
                  key={`rfc${rfc.id}`}
                  href={`/rfc/${rfc.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground text-gray-700">{rfc.title}</span>
                  <span className="text-sm text-gray-500">{formatRelative(pickTimestamp(rfc))}</span>
                </Link>
              ))
            )}
          </Card>
        )}
      </section>

      {/* Recent ADRs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">Recent ADRs</h2>
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
              <div className="py-3 text-sm text-gray-700">Loading…</div>
            ) : adrs.length === 0 ? (
              <div className="py-3 text-sm text-gray-700">No ADRs yet.</div>
            ) : (
              adrs.map((adr) => (
                <Link
                  key={`adr${adr.id}`}
                  href={`/adr/${adr.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground text-gray-700">{adr.title}</span>
                  <span className="text-sm text-gray-500">{formatRelative(pickTimestamp(adr))}</span>
                </Link>
              ))
            )}
          </Card>
        )}
      </section>
    </main>
  );
}
