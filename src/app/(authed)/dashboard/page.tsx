import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getRecentRfcs, getRecentAdrs } from "@/lib/backend";
import type { AdrResponse, RfcResponse } from "@/lib/types";
import { cookies } from "next/headers";

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

// stabilan ključ sa fallbackom (id || index) + timestamp
function itemKey(
  x: { id?: number | string; createdAt?: string; updatedAt?: string },
  idx: number
) {
  const ts = x.updatedAt ?? x.createdAt ?? "na";
  const id = x.id ?? `i${idx}`;
  return `${id}-${ts}`;
}

export default async function DashboardPage() {
  const userId = (await cookies()).get("x-user-id")?.value ?? "1";

  let rfcs: RfcResponse[] = [];
  let adrs: AdrResponse[] = [];
  let rfcsErr: string | null = null;
  let adrsErr: string | null = null;

  await Promise.all([
    (async () => {
      try {
        const page = await getRecentRfcs(4);
        rfcs = page.content;
      } catch (e: unknown) {
        rfcsErr = e instanceof Error ? e.message : "Failed to load RFCs";
      }
    })(),
    (async () => {
      try {
        const page = await getRecentAdrs(4);
        adrs = page.content;
      } catch (e: unknown) {
        adrsErr = e instanceof Error ? e.message : "Failed to load ADRs";
      }
    })(),
  ]);

  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="text-4xl font-bold mb-8">Welcome</h1>

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
            {rfcs.length === 0 && (
              <div className="py-3 text-sm text-muted-foreground">No RFCs yet.</div>
            )}
            {rfcs.map((rfc, i) => (
              <Link
                key={itemKey(rfc, i)}
                href={`/rfc/${rfc.id}`}
                className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{rfc.title}</span>
                <span className="text-sm text-gray-500">{formatRelative(pickTimestamp(rfc))}</span>
              </Link>
            ))}
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
            {adrs.length === 0 && (
              <div className="py-3 text-sm text-muted-foreground">No ADRs yet.</div>
            )}
            {adrs.map((adr, i) => (
              <Link
                key={itemKey(adr, i)}
                href={`/adr/${adr.id}`}
                className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{adr.title}</span>
                <span className="text-sm text-gray-500">{formatRelative(pickTimestamp(adr))}</span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </main>
  );
}
