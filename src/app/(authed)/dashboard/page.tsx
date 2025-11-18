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
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function pickTimestamp<T extends { createdAt?: string; updatedAt?: string }>(x: T) {
  return x.createdAt ?? x.updatedAt ?? "";
}

export default function DashboardPage() {
  const [rfcs, setRfcs] = useState<RfcResponse[]>([]);
  const [adrs, setAdrs] = useState<AdrResponse[]>([]);
  const [rfcsErr, setRfcsErr] = useState<string | null>(null);
  const [adrsErr, setAdrsErr] = useState<string | null>(null);
  const [loadingRfcs, setLoadingRfcs] = useState(true);
  const [loadingAdrs, setLoadingAdrs] = useState(true);

  useEffect(() => {
    // Fetch RFCs
    (async () => {
      setLoadingRfcs(true);
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs`);
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
        const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs`);
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

  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Welcome</h1>

      {/* Recent RFCs */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent RFCs</h2>
          <Link href="/rfc" className="text-sm text-purple-600 hover:text-purple-700 hover:underline">
            View all &gt;
          </Link>
        </div>

        {rfcsErr ? (
          <p className="text-sm text-red-600">{rfcsErr}</p>
        ) : (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {loadingRfcs ? (
              <div className="py-3 text-sm text-muted-foreground">Loading…</div>
            ) : rfcs.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">No RFCs yet.</div>
            ) : (
              rfcs.map((rfc) => (
                <Link
                  key={`rfc${rfc.id}`}
                  href={`/rfc/${rfc.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{rfc.title}</span>
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
          <h2 className="text-2xl font-semibold">Recent ADRs</h2>
          <Link href="/adr" className="text-sm text-purple-600 hover:text-purple-700 hover:underline">
            View all &gt;
          </Link>
        </div>

        {adrsErr ? (
          <p className="text-sm text-red-600">{adrsErr}</p>
        ) : (
          <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
            {loadingAdrs ? (
              <div className="py-3 text-sm text-muted-foreground">Loading…</div>
            ) : adrs.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">No ADRs yet.</div>
            ) : (
              adrs.map((adr) => (
                <Link
                  key={`adr${adr.id}`}
                  href={`/adr/${adr.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{adr.title}</span>
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
