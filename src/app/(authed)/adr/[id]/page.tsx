"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Check, Pencil, AlertTriangle, X } from "lucide-react"

type DetailedADR = {
  id: number
  rfcId: number
  title: string
  context: string
  decision: string
  consequences: string
  status: 'APPROVED' | 'DRAFT'
  createdAt: string
  updatedAt: string
  name?: string
}

type Rfc = {
  id: number
  title: string
  authorName: string
  status: string
  createdAt: string
}

function EditADRModal({ 
  open, 
  adr, 
  onClose, 
  onSave 
}: { 
  open: boolean
  adr: DetailedADR | null
  onClose: () => void
  onSave: (updatedAdr: Partial<DetailedADR>) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    context: '',
    decision: '',
    consequences: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && adr) {
      setFormData({
        title: adr.title || '',
        context: adr.context || '',
        decision: adr.decision || '',
        consequences: adr.consequences || ''
      })
    }
  }, [open, adr])

  const handleSubmit = async () => {
    if (!adr) return
    
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save ADR:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      onClick={() => !isSubmitting && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm backdrop-saturate-125 p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto my-8 border-2 border-violet-600"
      >
        {/* Modal Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-center text-gray-900">Edit ADR</h2>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Context */}
          <div>
            <label htmlFor="context" className="block text-sm font-semibold text-gray-900 mb-2">
              Context <span className="text-red-500">*</span>
            </label>
            <textarea
              id="context"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              placeholder="Describe the context"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Decision */}
          <div>
            <label htmlFor="decision" className="block text-sm font-semibold text-gray-900 mb-2">
              Decision <span className="text-red-500">*</span>
            </label>
            <textarea
              id="decision"
              value={formData.decision}
              onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
              placeholder="Describe the decision"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Consequences */}
          <div>
            <label htmlFor="consequences" className="block text-sm font-semibold text-gray-900 mb-2">
              Consequences <span className="text-red-500">*</span>
            </label>
            <textarea
              id="consequences"
              value={formData.consequences}
              onChange={(e) => setFormData({ ...formData, consequences: e.target.value })}
              placeholder="Describe the consequences"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-400 disabled:cursor-not-allowed"
            disabled={isSubmitting || !formData.title || !formData.context || !formData.decision || !formData.consequences}
          >
            <Check className="w-5 h-5" />
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ADRSidebar({ adr, rfc, onEdit, onApprove }: { 
  adr: DetailedADR
  rfc: Rfc | null
  onEdit: () => void
  onApprove: () => void
}) {
  const isUnderReview = adr?.status === 'DRAFT'

  return (
    <aside className="w-80 shrink-0 bg-background p-6">
      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Decision</h3>
          <div className="flex items-center gap-2 text-sm">
            {adr.status === 'APPROVED' ? (
              <>
                <div className="flex size-5 items-center justify-center rounded bg-green-500">
                  <Check className="size-3 text-white" />
                </div>
                <span className="space-y-4 leading-relaxed text-muted-foreground text-gray-700 whitespace-pre-line">
                  Approved on {new Date(adr.updatedAt).toLocaleDateString()}
                </span>
              </>
            ) : (
              <>
                <div className="flex size-5 items-center justify-center rounded bg-gray-200">
                  <Pencil className="size-3 text-gray-700" />
                </div>
                <span className="text-muted-foreground">
                  Drafted on {new Date(adr.updatedAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-purple-600">Source RFC</h3>
          {rfc ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex size-5 items-center justify-center rounded bg-purple-100">
                  <AlertTriangle className="size-3 text-purple-600" />
                </div>
                <Link 
                  href={`/rfc/${rfc.id}`} 
                  className="font-medium text-black hover:underline"
                  title={rfc.title}
                >
                  {rfc.title}
                </Link>
              </div>

              <div className="mt-4 flex flex-col items-start gap-3">
                {isUnderReview && (
                  <>
                    <button 
                      className="flex size-10 items-center justify-center rounded-full bg-purple-600 text-white shadow hover:bg-purple-700"
                      title="Edit ADR"
                      onClick={onEdit}
                    >
                      <Pencil className="size-5" />
                    </button>
                    <button 
                      className="flex size-10 items-center justify-center rounded-full bg-green-600 text-white shadow hover:bg-green-700"
                      title="Approve"
                      onClick={onApprove}
                    >
                      <Check className="size-5" />
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading RFC info...</p>
          )}
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

  const [adr, setAdr] = useState<DetailedADR | null>(null)
  const [rfc, setRfc] = useState<Rfc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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
        setRfc(null)
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs/${adrId}`, { signal: ctrl.signal })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(`GET /adrs/${adrId} ${res.status} — ${t}`)
        }
        
        const json = (await res.json()) as DetailedADR
        setAdr({ ...json, id: json.id ?? adrId, title: json.title ?? json.name })
        
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Failed to fetch ADR")
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [adrId, idStr])

  useEffect(() => {
    if (!adr || !adr.rfcId) {
        if (adr) setLoading(false)
        return
    }

    const ctrl = new AbortController()
    ;(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${adr.rfcId}`, { signal: ctrl.signal })
            if (!res.ok) {
                const t = await res.text()
                throw new Error(`GET /rfcs/${adr.rfcId} ${res.status} — ${t}`)
            }
            const json = (await res.json()) as Rfc
            setRfc(json)
        } catch (e: any) {
            if (e?.name !== "AbortError") setError(e?.message ?? "Failed to fetch RFC")
        } finally {
            setLoading(false)
        }
    })()
    return () => ctrl.abort()
  }, [adr])

  const handleApproveClick = async () => {
    if (!adr) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs/${adr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: adr.title,
          context: adr.context,
          decision: adr.decision,
          consequences: adr.consequences,
          status: 'APPROVED'
        })
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(`PUT /adrs/${adr.id} ${res.status} — ${t}`)
      }

      const updatedAdr = await res.json()
      setAdr({ ...adr, ...updatedAdr, status: 'APPROVED' })
    } catch (e: any) {
      alert(`Failed to approve ADR: ${e.message}`)
    }
  }

  const handleEditClick = () => {
    setIsEditModalOpen(true)
  }

  const handleSaveAdr = async (updatedData: Partial<DetailedADR>) => {
    if (!adr) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs/${adr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: updatedData.title,
          context: updatedData.context,
          decision: updatedData.decision,
          consequences: updatedData.consequences,
          status: adr.status
        })
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(`PUT /adrs/${adr.id} ${res.status} — ${t}`)
      }

      const updated = await res.json()
      setAdr({ ...adr, ...updated })
    } catch (e: any) {
      alert(`Failed to save ADR: ${e.message}`)
      throw e
    }
  }

  if (loading) return <div className="p-8">Loading…</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!adr) return <div className="p-8">ADR Not found.</div>

  const title = adr.title ?? `ADR #${adr.id}`

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">{title}</h1>

      <div className="mx-auto flex max-w-6xl">
        <main className="flex-1 p-8">
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold text-violet-700 mb-4">Context</h2>
              <div className="space-y-4 leading-relaxed text-muted-foreground text-gray-700 whitespace-pre-line">
                {adr.context ? adr.context.split('\n').map((p, i) => <p key={i}>{p}</p>) : "—"}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-700 mb-4">Decision</h2>
              <div className="space-y-4 leading-relaxed text-muted-foreground text-gray-700 whitespace-pre-line">
                {adr.decision ? adr.decision.split('\n').map((p, i) => <p key={i}>{p}</p>) : "—"}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-700 mb-4">Consequences</h2>
              <div className="space-y-4 leading-relaxed text-muted-foreground text-gray-700 whitespace-pre-line">
                {adr.consequences ? adr.consequences.split('\n').map((p, i) => <p key={i}>{p}</p>) : "—"}
              </div>
            </section>
          </div>
        </main>

        <ADRSidebar 
          adr={adr} 
          rfc={rfc}
          onEdit={handleEditClick}
          onApprove={handleApproveClick}
        />
      </div>

      <EditADRModal
        open={isEditModalOpen}
        adr={adr}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAdr}
      />
    </div>
  )
}