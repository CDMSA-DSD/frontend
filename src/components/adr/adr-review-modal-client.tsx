"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ADRReviewModal, type AdrViewModel } from "./adr-review-modal"

type Props = {
  adr: AdrViewModel
  defaultOpen?: boolean
  rfcId?: number
}

export function ADRReviewModalClient({ adr, defaultOpen = true, rfcId }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const router = useRouter()

  return (
    <ADRReviewModal
      open={open}
      adr={adr}
      onClose={() => setOpen(false)}
      onBackToRfc={() => {
        if (rfcId) router.push(`/rfcs/${rfcId}`)
        else router.push("/rfcs")
      }}
      onEdit={(id) => router.push(`/adrs/${id}/edit`)}
      onPublish={async (id) => {
        // call your API route or backend here
        // await fetch(`/api/adrs/${id}/publish`, { method: "POST" })
        router.refresh()
      }}
    />
  )
}
