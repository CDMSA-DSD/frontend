"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function NewAdrPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [context, setContext] = useState("")
  const [decision, setDecision] = useState("")
  const [consequences, setConsequences] = useState("")
  const [rfcId, setRfcId] = useState<string>("") 
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const parsedRfcId = Number(rfcId)
    if (!Number.isFinite(parsedRfcId) || parsedRfcId <= 0) {
      setError("RFC ID is required and must be a positive number.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("http://localhost:8080/adrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          context,
          decision,
          consequences,
          rfcId: parsedRfcId,
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`POST /adrs ${res.status} — ${t}`)
      }
      const created = await res.json()
      const id = created.id ?? created.adrId
      router.push(`/adrs/${id}`)
    } catch (e: any) {
      setError(e?.message ?? "Failed to create ADR")
    } finally {
      setSaving(false)
    }
  }

  const submitDisabled =
    saving ||
    !title.trim() ||
    !context.trim() ||
    !decision.trim() ||
    !Number.isFinite(Number(rfcId)) ||
    Number(rfcId) <= 0

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create ADR</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="context">Context</Label>
          <Textarea id="context" value={context} onChange={(e) => setContext(e.target.value)} className="min-h-[120px]" />
        </div>

        <div>
          <Label htmlFor="decision">Decision</Label>
          <Textarea id="decision" value={decision} onChange={(e) => setDecision(e.target.value)} className="min-h-[120px]" />
        </div>

        <div>
          <Label htmlFor="consequences">Consequences</Label>
          <Textarea id="consequences" value={consequences} onChange={(e) => setConsequences(e.target.value)} className="min-h-[120px]" />
        </div>

        <div>
          <Label htmlFor="rfcId">RFC ID</Label>
          <Input
            id="rfcId"
            type="number"
            value={rfcId}
            onChange={(e) => setRfcId(e.target.value)}
            placeholder="e.g. 1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Required. Link this ADR to an existing RFC (ID from your DB).
          </p>
        </div>

        <Button type="submit" disabled={submitDisabled} className="w-full h-11">
          {saving ? "Creating…" : "Create ADR"}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}
