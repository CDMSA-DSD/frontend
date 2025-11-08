"use client"

import { useEffect, useRef } from "react"

export type AdrStatus = "DRAFT" | "PROPOSED" | "APPROVED" | "REJECTED"

export interface AdrViewModel {
  id: number
  title: string
  context?: string
  decision?: string
  consequences?: string
  status?: AdrStatus
  createdAt?: string // ISO
  authorName?: string
}

interface ADRReviewModalProps {
  open: boolean
  adr: AdrViewModel | null
  onClose: () => void
  onBackToRfc?: () => void
  onEdit?: (adrId: number) => void
  onPublish?: (adrId: number) => void
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function statusClasses(status?: AdrStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700"
    case "REJECTED":
      return "bg-red-100 text-red-700"
    case "PROPOSED":
      return "bg-indigo-100 text-indigo-700"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

export function ADRReviewModal({
  open,
  adr,
  onClose,
  onBackToRfc,
  onEdit,
  onPublish,
}: ADRReviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Focus the first button on open
  useEffect(() => {
    if (open) firstFocusRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-hidden={!open}
    >
      {/* Backdrop with blur */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adr-modal-title"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border-2 border-indigo-600 p-6 md:p-8"
      >
        {/* Close (X) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Header */}
        <h1 id="adr-modal-title" className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
          Review and Publish ADR
        </h1>

        {/* ADR Info Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border border-gray-200 bg-white rounded-xl p-3 w-full">
          {/* Left: icon + title */}
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="shrink-0 w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="7" cy="7" r="3" />
                <circle cx="13" cy="13" r="3" />
                <circle cx="13" cy="7" r="3" />
              </svg>
            </div>
            <h2 className="text-lg font-bold wrap-break-word">{adr?.title ?? "Untitled ADR"}</h2>
          </div>

          {/* Right: status/date/author */}
          <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-end gap-6 md:gap-10 text-sm">
            <div className="flex flex-col items-center">
              <div className="text-gray-500 mb-1">Status</div>
              <div className={`font-medium px-3 py-0.5 rounded-md leading-none ${statusClasses(adr?.status)}`}>
                {adr?.status ?? "DRAFT"}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-gray-500 mb-1">Date</div>
              <div className="font-medium leading-none pt-[3px]">{formatDate(adr?.createdAt)}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-gray-500 mb-1">Author</div>
              <div className="font-medium leading-none pt-[3px]">{adr?.authorName ?? "—"}</div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="font-bold mb-2">Context</h3>
            <div className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {adr?.context?.trim() || "No context provided."}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Decision Summary</h3>
            <div className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {adr?.decision?.trim() || "No decision summary provided."}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Consequences</h3>
            <div className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {adr?.consequences?.trim() || "No consequences provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            ref={firstFocusRef}
            onClick={onBackToRfc}
            className="px-6 py-2.5 text-sm font-medium text-indigo-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors w-full md:w-auto"
          >
            Back to RFC
          </button>

          <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
            <button
              onClick={() => adr?.id && onEdit?.(adr.id)}
              className="px-6 py-2.5 text-sm font-medium text-indigo-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors w-full md:w-auto"
            >
              Edit
            </button>
            <button
              onClick={() => adr?.id && onPublish?.(adr.id)}
              className="px-24 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors w-full md:w-auto"
            >
              Publish to GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
