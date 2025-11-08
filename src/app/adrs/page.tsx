"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type AdrListItem = {
  id?: number
  title?: string
  name?: string
}

function keyFor(x: AdrListItem, i: number) {
  return x.id != null ? `id-${x.id}` : `idx-${i}`
}

export default function AdrListPage() {
  const [items, setItems] = useState<AdrListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"}/adrs`)
        if (!res.ok) throw new Error(`GET /adrs ${res.status}`)
        const page = await res.json()

        const raw: AdrListItem[] = page?.content ?? []

        const seen = new Set<number>()
        const deduped: AdrListItem[] = []
        for (const it of raw) {
          if (it?.id == null) {
            deduped.push(it)
          } else if (!seen.has(it.id)) {
            seen.add(it.id)
            deduped.push(it)
          }
        }

        setItems(deduped)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load ADRs")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Loading…</div>
  if (error)   return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ADRs</h1>
        <Link href="/adrs/new">
          <Button>New ADR</Button>
        </Link>
      </div>

      <ul className="divide-y">
        {items.map((it, i) => (
          <li key={keyFor(it, i)} className="py-3">
            <Link href={`/adrs/${it.id ?? ""}`} className="hover:underline">
              {it.title ?? it.name ?? (it.id != null ? `ADR #${it.id}` : "ADR")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
