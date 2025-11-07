import { ADRReviewModal } from "@/components/adr/adr-review-modal"

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background content that will be blurred */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-16 bg-white/50 rounded-lg" />
          <div className="h-32 bg-white/50 rounded-lg" />
          <div className="h-24 bg-white/50 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 bg-white/50 rounded-lg" />
            <div className="h-40 bg-white/50 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Modal with backdrop blur */}
      <ADRReviewModal />
    </div>
  )
}
