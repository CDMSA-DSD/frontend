"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Check, User, Pencil, ArrowLeftRight, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Adr = {
  id: number
  title?: string
  name?: string
  context?: string
  decision?: string
  consequences?: string
}

function ParticipantItem({ handle, role }: { handle: string; role: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs">
          <User className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{handle}</span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}

function ADRSidebar() {
  return (
    <aside className="w-80 shrink-0 bg-background p-6">
      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Decision</h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-5 items-center justify-center rounded bg-green-500">
              <Check className="size-3 text-white" />
            </div>
            <span className="text-muted-foreground">Adopted on Date</span>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Participant</h3>
          <div className="space-y-3">
            <ParticipantItem handle="@Alice" role="Creator" />
            <ParticipantItem handle="@Bob" role="Reviewer" />
            <ParticipantItem handle="@Carlos" role="Observer" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Consequences</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            List of RFC that will be impacted by the decision if adopted.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-5 items-center justify-center rounded bg-purple-100">
              <AlertTriangle className="size-3 text-purple-600" />
            </div>
            <span className="text-black">Name</span>
          </div>
          <div className="mt-4 flex flex-col items-start gap-3">
            <button className="flex size-10 items-center justify-center rounded-full bg-purple-600 text-white shadow hover:bg-purple-700">
              <Pencil className="size-5" />
            </button>
            <button className="flex size-10 items-center justify-center rounded-full bg-purple-600 text-white shadow hover:bg-purple-700">
              <ArrowLeftRight className="size-5" />
            </button>
          </div>
        </section>
      </div>
    </aside>
  )
}

export default function AdrDetailPage() {
  const params = useParams<{ id: string | string[] }>()
  const idStr = useMemo(() => {
    const raw = params?.id
    return Array.isArray(raw) ? raw[0] : raw
  }, [params])

  const adrId = useMemo(() => Number(idStr), [idStr])

  const [adr, setAdr] = useState<Adr | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idStr) {          
      setError("Invalid ADR id")
      setLoading(false)
      return
    }
    if (!Number.isFinite(adrId)) { 
      setError(`Invalid ADR id: ${idStr}`)
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`http://localhost:8080/adrs/${adrId}`, { signal: ctrl.signal })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(`GET /adrs/${adrId} ${res.status} — ${t}`)
        }
        const json = (await res.json()) as Adr
        setAdr({ ...json, id: json.id ?? adrId, title: json.title ?? json.name })
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Failed to fetch ADR")
      } finally {
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [adrId, idStr])

  if (loading) return <div className="p-8">Loading…</div>
  if (error)   return <div className="p-8 text-red-600">{error}</div>
  if (!adr)    return <div className="p-8">Not found.</div>

  const title = adr.title ?? `ADR #${adr.id}`

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background px-6 py-5">
        <h1 className="mx-auto max-w-5xl text-center text-2xl font-semibold">{title}</h1>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <main className="flex-1 p-8">
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-purple-600">Context</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>{adr.context ?? "—"}</p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-purple-600">Decision</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>{adr.decision ?? "—"}</p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-purple-600">Consequences</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>{adr.consequences ?? "—"}</p>
              </div>
            </section>
          </div>
        </main>

        <ADRSidebar />
      </div>
    </div>
  )
}
