import { ADRReviewModalClient } from "@/components/adr/adr-review-modal-client"
import { getAdrById } from "@/lib/backend"

export default async function Page() {
  const adr = await getAdrById(1) // fetched on the server

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ...your background... */}
      <ADRReviewModalClient adr={adr} rfcId={/* adr.rfcId ?? */ undefined} />
    </div>
  )
}
