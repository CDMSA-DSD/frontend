import { Card } from "@/components/ui/card"
import Link from "next/link"

// Mock data for RFCs and ADRs
const recentRFCs = [
  { id: 1, title: "Title Example RFC 1", timestamp: "2 hours ago" },
  { id: 2, title: "Title Example RFC 2", timestamp: "Yesterday" },
  { id: 3, title: "Title Example RFC 3", timestamp: "April 24, 2025" },
  { id: 4, title: "Title Example RFC 4", timestamp: "June 4, 2024" },
]

const recentADRs = [
  { id: 1, title: "Title Example ADR 1", timestamp: "5 hours ago" },
  { id: 2, title: "Title Example ADR 2", timestamp: "Yesterday" },
  { id: 3, title: "Title Example ADR 3", timestamp: "October 4, 2025" },
  { id: 4, title: "Title Example ADR 4", timestamp: "May 20, 2024" },
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="text-4xl font-bold mb-8">Welcome</h1>

      {/* Recent RFCs Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent RFCs</h2>
          <Link
            href="/rfcs"
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
          >
            View all &gt;
          </Link>
        </div>

        <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
          {recentRFCs.map((rfc) => (
            <div
              key={rfc.id}
              className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <span className="text-sm font-medium text-foreground">
                {rfc.title}
              </span>
              <span className="text-sm text-gray-500">{rfc.timestamp}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* Recent ADRs Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent ADRs</h2>
          <Link
            href="/adrs"
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
          >
            View all &gt;
          </Link>
        </div>

        <Card className="border border-gray-200 divide-y divide-gray-200 px-4 shadow-sm rounded-xl">
          {recentADRs.map((adr) => (
            <div
              key={adr.id}
              className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <span className="text-sm font-medium text-foreground">
                {adr.title}
              </span>
              <span className="text-sm text-gray-500">{adr.timestamp}</span>
            </div>
          ))}
        </Card>
      </section>
    </main>
  )
}
