export function ADRReviewModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />

      {/* Modal content */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border-2 border-indigo-600 p-6 md:p-8">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
          Review and Publish ADR
        </h1>

        {/* ADR Info Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border border-gray-200 bg-white rounded-xl p-3 w-full">
          {/* Left side: icon + title */}
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="shrink-0 w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-purple-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="7" cy="7" r="3" />
                <circle cx="13" cy="13" r="3" />
                <circle cx="13" cy="7" r="3" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">ADR Title</h2>
          </div>

          {/* Right side: status/date/author */}
          <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-end gap-6 md:gap-10 text-sm">
            <div className="flex flex-col items-center">
              <div className="text-gray-500 mb-1">Status</div>
              <div className="font-medium text-gray-700 px-3 py-0.5 rounded-md bg-gray-200 leading-none">
                Proposed
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-gray-500 mb-1">Date</div>
              <div className="font-medium leading-none pt-[3px]">
                Jun 5, 2024
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-gray-500 mb-1">Author</div>
              <div className="font-medium leading-none pt-[3px]">Mark</div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="font-bold mb-2">Context</h3>
            <div className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Decision Summary</h3>
            <div className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Consequences</h3>
            <div className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <button className="px-6 py-2.5 text-sm font-medium text-indigo-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors w-full md:w-auto">
            Back to RFC
          </button>

          <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
            <button className="px-6 py-2.5 text-sm font-medium text-indigo-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors w-full md:w-auto">
              Edit
            </button>
            <button className="px-24 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors w-full md:w-auto">
              Publish to GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
