"use client"
import { FileText, Lightbulb, MessageSquare, ThumbsUp, ThumbsDown, Plus, ArrowLeft, Paperclip } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { parseDescription } from '@/lib/utils'
import fetcher from '@/src/lib/fetcher'

interface BackendAlternative {
  id: number
  title: string
  description: string
  pros: string // Pros come as a single string
  cons: string // Cons come as a single string
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string | null
  yes: number
  no: number
}

interface BackendComment {
  id: number
  content: string
  authorId: number
  author: string
  createdAt: string
  updatedAt: string | null
}

interface BackendRFC {
  id: number
  title: string
  description: string
  userId: number
  authorName: string
  templateId: number
  orgId: number
  status: string
  createdAt: string
  updatedAt: string
  isAuthor: boolean
  alternatives: BackendAlternative[]
  comments: BackendComment[]
}

type TabType = 'presentation' | 'alternatives' | 'discussion'

interface Alternative {
  id: number
  title: string
  author: string
  publishedDate: string
  description: string
  fullText: string
  upvotes: number
  downvotes: number
  pros: string[]
  cons: string[]
  attachments?: string[]
}

interface Comment {
  id: number
  author: string
  date: string
  content: string
  replies?: Comment[]
}

interface AlternativeForm {
  title: string
  description: string
  pros: string[]
  cons: string[]
  prosInput: string
  consInput: string
}

interface AdrFormData {
  title: string
  context: string
  decision: string
  consequences: string
}

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const mapAlternative = (backendAlt: BackendAlternative): Alternative => ({
  id: backendAlt.id,
  title: backendAlt.title,
  author: backendAlt.authorName,
  publishedDate: formatDate(backendAlt.createdAt),
  description: backendAlt.description.substring(0, 150) + '...',
  fullText: backendAlt.description,
  upvotes: backendAlt.yes ?? 0,
  downvotes: backendAlt.no ?? 0,
  pros: backendAlt.pros.split(';').map(s => s.trim()).filter(Boolean),
  cons: backendAlt.cons.split(';').map(s => s.trim()).filter(Boolean),
  attachments: backendAlt.id === 1 ? ['document1.pdf', 'diagram.png'] : []
})


// Function to map backend comment to client comment
const mapComment = (backendComment: BackendComment): Comment => ({
  id: backendComment.id,
  author: backendComment.author,
  date: formatDate(backendComment.createdAt),
  content: backendComment.content,
  replies: [] // Backend doesn't provide replies, keep empty for now
});


export default function RFCDetailPage() {
  const params = useParams()
  const rfcId = params.id

  const [activeTab, setActiveTab] = useState<TabType>('presentation')
  const [selectedAlternative, setSelectedAlternative] = useState<Alternative | null>(null)
  const [showNewAlternativeModal, setShowNewAlternativeModal] = useState(false)
  const [isSubmittingAlternative, setIsSubmittingAlternative] = useState(false)
  const [alternativeForm, setAlternativeForm] = useState<AlternativeForm>({ title: '', description: '', pros: [], cons: [], prosInput: '', consInput: '' })

  const [isClosing, setIsClosing] = useState(false)
  const [showAdrModal, setShowAdrModal] = useState(false)
  const [winningAlternative, setWinningAlternative] = useState<Alternative | null>(null)
  const [isSubmittingAdr, setIsSubmittingAdr] = useState(false)
  const [isGeneratingAdr, setIsGeneratingAdr] = useState(false)
  const [adrFormData, setAdrFormData] = useState<AdrFormData>({
    title: '',
    context: '',
    decision: '',
    consequences: ''
  })

  const [rfcData, setRfcData] = useState<BackendRFC | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCommentContent, setNewCommentContent] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)

  const alternatives: Alternative[] = rfcData ? rfcData.alternatives.map(mapAlternative) : []
  const comments: Comment[] = rfcData ? rfcData.comments.map(mapComment) : []

  const clientComments: Comment[] = comments.length > 0 ? [
    { ...comments[0], replies: comments.slice(1).length > 0 ? [{ ...comments[1], replies: [] }] : [] }, // Simulating a reply chain
    ...comments.slice(2)
  ] : []

  const [userVotes, setUserVotes] = useState<Record<number, boolean | null>>({})
  const isReviewer = true

  useEffect(() => {
    if (!rfcId) return;
    // fetchRfcData is defined outside the effect so it can be reused (e.g. after posting a comment)
    fetchRfcData()
  }, [rfcId])

  const fetchRfcData = async () => {
    if (!rfcId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch RFC (Status: ${response.status})`)
      }

      const data: BackendRFC = await response.json()
      setRfcData(data)
    } catch (e) {
      console.error("Fetching RFC failed:", e)
      setError(e instanceof Error ? e.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVoteForAlternative = async (altId: number, outcome: boolean) => {
    if (!isReviewer) return
    if (rfcData?.status !== 'UNDER_REVIEW') return

    setUserVotes(prev => {
      const current = prev[altId] ?? null
      const next = current === outcome ? null : outcome
      return { ...prev, [altId]: next }
    })

    try {
      await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/alternatives/${altId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outcome })
      })

      await fetchRfcData()
    } catch (e) {
      console.error('Vote failed', e)
    }
  }

  const handleSubmitAlternative = async () => {
    if (isSubmittingAlternative) return
    if (!rfcId) return

    const payload = {
      title: alternativeForm.title,
      description: alternativeForm.description,
      pros: alternativeForm.pros.join(';'),
      cons: alternativeForm.cons.join(';')
    }

    setIsSubmittingAlternative(true)
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(`Failed to create alternative (status ${res.status})`)

      const refreshed = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}`)
      if (refreshed.ok) {
        const data: BackendRFC = await refreshed.json()
        setRfcData(data)
      }

      setShowNewAlternativeModal(false)
      setAlternativeForm({ title: '', description: '', pros: [], cons: [], prosInput: '', consInput: '' })
    } catch (e) {
      console.error('Create alternative failed:', e)
      alert('Failed to create alternative. See console for details.')
    } finally {
      setIsSubmittingAlternative(false)
    }
  }

  const handleCancelAlternative = () => {
    if (isSubmittingAlternative) return
    setShowNewAlternativeModal(false)
    setAlternativeForm({ title: '', description: '', pros: [], cons: [], prosInput: '', consInput: '' })
  }

  const addProsItem = () => {
    const val = alternativeForm.prosInput.trim()
    if (!val) return
    setAlternativeForm(prev => ({ ...prev, pros: [...prev.pros, val], prosInput: '' }))
  }

  const removeProsItem = (index: number) => {
    setAlternativeForm(prev => ({ ...prev, pros: prev.pros.filter((_, i) => i !== index) }))
  }

  const addConsItem = () => {
    const val = alternativeForm.consInput.trim()
    if (!val) return
    setAlternativeForm(prev => ({ ...prev, cons: [...prev.cons, val], consInput: '' }))
  }

  const removeConsItem = (index: number) => {
    setAlternativeForm(prev => ({ ...prev, cons: prev.cons.filter((_, i) => i !== index) }))
  }

  const handlePostComment = async () => {
    if (isPostingComment) return
    if (!rfcId) return
    if (!newCommentContent || newCommentContent.trim().length === 0) return

    const payload = { content: newCommentContent.trim() }

    setIsPostingComment(true)
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(`Failed to post comment (status ${res.status})`)

      // Refresh RFC data to include the new comment
      await fetchRfcData()
      // Clear the textarea
      setNewCommentContent('')
    } catch (e) {
      console.error('Posting comment failed:', e)
      alert('Failed to post comment. See console for details.')
    } finally {
      setIsPostingComment(false)
    }
  }

  const handleCloseNoDecision = async () => {
    if (isClosing || !rfcId) return;

    if (!confirm('Are you sure you want to close this RFC without a decision? This action cannot be undone.')) {
      return;
    }

    setIsClosing(true);
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "alternativeId": null
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to close RFC (status ${res.status})`);
      }
      await fetchRfcData();
    } catch (e) {
      console.error('Closing RFC failed:', e);
      alert('Failed to close RFC. See console for details.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleSelectAsDecision = async (alt: Alternative) => {
    if (!rfcData) return;

    setWinningAlternative(alt);

    const { context: rfcContext } = parseDescription(rfcData.description);

    setAdrFormData({
      title: 'Generating title...',
      context: 'Generating context...',
      decision: 'Generating decision...',
      consequences: 'Generating consequences...'
    });

    setShowAdrModal(true);

    // Attempt to fill from backend LLM endpoint.
    try {
      await fetchGeneratedAdr(alt.id)
    } catch (e) {
      console.log(`Failed to fetch generated ADR:`, e)

      // Fill with default values if backend generation fails
      setAdrFormData({
        title: `ADR: ${alt.title}`,
        context: rfcContext || `Context from RFC #${rfcId}: ${rfcData.title}`,
        decision: `We have decided to implement the "${alt.title}" alternative.\n\nDetails:\n${alt.fullText}`,
        consequences: ''
      });
    }
  };

  const fetchGeneratedAdr = async (altId: number) => {
    if (!rfcId) return
    setIsGeneratingAdr(true)
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/generateadr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alternativeId: altId })
      })

      if (!res.ok) {
        throw new Error(`Generate ADR failed (status ${res.status})`)
      }

      const data = await res.json()

      if (data) {
        setAdrFormData({
          title: data.title,
          context: data.context,
          decision: data.decision,
          consequences: data.consequences
        })
      }
    } catch (e) {
      console.error('Failed to generate ADR from backend:', e)
    } finally {
      setIsGeneratingAdr(false)
    }
  }

  const handleSubmitAdr = async () => {
    if (isSubmittingAdr || !winningAlternative || !rfcId) return;

    const payload = {
      ...adrFormData,
      status: 'DRAFT',
      rfcId: parseInt(rfcId as string, 10)
    };

    // Simple validation
    if (!payload.title || !payload.context || !payload.decision || !payload.consequences) {
      alert('Please fill in all ADR fields (Title, Context, Decision, Consequences).');
      return;
    }

    setIsSubmittingAdr(true);
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to create ADR (status ${res.status})`);
      }

      try {
        const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/close`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "alternativeId": winningAlternative.id
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to close RFC (status ${res.status})`);
        }
      } catch (e) {
        console.error('Closing RFC failed:', e);
        alert('Failed to close RFC. See console for details.');
      }

      setShowAdrModal(false);
      setWinningAlternative(null);
      await fetchRfcData();

    } catch (e) {
      console.error('Failed to create ADR:', e);
      alert('Failed to create ADR. See console for details.');
    } finally {
      setIsSubmittingAdr(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white p-8 text-center text-xl font-medium">Loading RFC details...</div>
  }

  if (error || !rfcData) {
    return (
      <div className="min-h-screen bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading RFC</h1>
        <p className="text-gray-700">{error || "RFC data could not be loaded or is missing."}</p>
      </div>
    )
  }

  const renderPresentation = () => {
    const { context: contextText, problem: problemText } = parseDescription(rfcData.description)

    return (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-violet-700 mb-4">Context</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {contextText || rfcData.description}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-violet-700 mb-4">Problem</h2>
          <div className="space-y-4 text-gray-700">
            {problemText ? (
              <p className="leading-relaxed whitespace-pre-line">{problemText}</p>
            ) : (
              <p className="leading-relaxed">
                No problem text was found in the RFC description.
              </p>
            )}
          </div>
        </section>

        {rfcData.status === 'UNDER_REVIEW' && rfcData.isAuthor && (
          <button
            onClick={handleCloseNoDecision}
            disabled={isClosing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isClosing ? 'Closing...' : 'Close RFC (No Decision)'}
          </button>
        )}
      </div>
    )
  }

  const renderAlternativeCard = (alt: Alternative, isExpanded: boolean = false) => (
    <div
      key={alt.id}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg width="131" height="96" viewBox="0 0 131 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.6">
                <line y1="-1.50402" x2="26.6757" y2="-1.50402"
                  transform="matrix(0.72131 -0.692613 0.691627 0.722255 44.282 82.0857)" stroke="#625B71"
                  strokeOpacity="0.47" strokeWidth="3.00805" />
                <line y1="-1.50402" x2="46.9282" y2="-1.50402"
                  transform="matrix(0.999747 0.022497 -0.0224356 0.999748 13.9697 54.8997)" stroke="#625B71"
                  strokeOpacity="0.47" strokeWidth="3.00805" />
                <line y1="-1.50402" x2="46.6837" y2="-1.50402"
                  transform="matrix(0.671888 0.740653 -0.739738 0.672895 33.4744 15.0444)" stroke="#625B71"
                  strokeOpacity="0.47" strokeWidth="3.00805" />
                <line y1="-1.50402" x2="38.7414" y2="-1.50402"
                  transform="matrix(0.646343 -0.763047 0.762175 0.647372 74.3296 50.6768)" stroke="#625B71"
                  strokeOpacity="0.47" strokeWidth="3.00805" />
                <line y1="-1.50402" x2="41.2294" y2="-1.50402"
                  transform="matrix(0.990922 0.134438 -0.134077 0.990971 76.9661 58.8589)" stroke="#625B71"
                  strokeOpacity="0.47" strokeWidth="3.00805" />
                <line y1="-1.50402" x2="40.2477" y2="-1.50402"
                  transform="matrix(0.464978 -0.885322 0.884798 0.465975 10.0161 50.6768)" stroke="#625B71"
                  strokeOpacity="0.47" strokeWidth="3.00805" />
                <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#AEA9E8" />
                <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#C4B7FF" />
                <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#5E50A4" />
                <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#A67DFF" />
                <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#6A63BF" />
                <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5658DA" />
              </g>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3
            className="text-xl font-semibold text-violet-700 mb-2 cursor-pointer hover:text-violet-800"
            onClick={() => setSelectedAlternative(alt)}
          >
            {alt.title}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Published {alt.publishedDate} by {alt.author}
          </p>
          <p className="text-gray-700 whitespace-pre-line">
            {isExpanded ? alt.fullText : alt.description}
          </p>

          {isExpanded && alt.attachments && alt.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
              <div className="space-y-2">
                {alt.attachments.map((attachment, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-violet-600">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voting */}
          <div className="flex items-center gap-4 mt-4">
            {/* Thumbs up */}
            <button
              type="button"
              onClick={() => handleVoteForAlternative(alt.id, true)}
              disabled={!isReviewer || rfcData.status !== 'UNDER_REVIEW'}
              className="flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsUp
                className={`w-5 h-5 ${userVotes[alt.id] === true
                    ? 'text-violet-600'
                    : 'text-gray-400 hover:text-violet-600'
                  }`}
              />
              <span className="text-sm text-gray-700">
                {alt.upvotes}
              </span>
            </button>

            {/* Thumbs down */}
            <button
              type="button"
              onClick={() => handleVoteForAlternative(alt.id, false)}
              disabled={!isReviewer || rfcData.status !== 'UNDER_REVIEW'}
              className="flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsDown
                className={`w-5 h-5 ${userVotes[alt.id] === false
                    ? 'text-violet-600'
                    : 'text-gray-400 hover:text-violet-600'
                  }`}
              />
              <span className="text-sm text-gray-700">
                {alt.downvotes}
              </span>
            </button>

            {(!isReviewer || rfcData.status !== 'UNDER_REVIEW') && (
              <span className="text-xs text-gray-500 ml-2">
                Voting disabled
              </span>
            )}
          </div>

          {rfcData.status === 'UNDER_REVIEW' && rfcData.isAuthor && !isExpanded && (
            <div className="mt-4">
              <button
                onClick={() => handleSelectAsDecision(alt)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Select as Decision & Close
              </button>
            </div>
          )}

          {rfcData.status === 'UNDER_REVIEW' && rfcData.isAuthor && isExpanded && (
            <div className="mt-6 border-t pt-4">
              <button
                onClick={() => handleSelectAsDecision(alt)}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Select as Decision & Close RFC
              </button>
            </div>
          )}
        </div>

        {/* Pros/Cons */}
        <div className="flex gap-4 flex-shrink-0">
          {/* Pros */}
          <div className="bg-green-50 rounded-lg p-4 w-48">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="font-semibold text-gray-900">Pros</span>
            </div>
            <ul className="space-y-2">
              {alt.pros.map((pro, idx) => (
                <li key={idx} className="text-sm text-gray-700">• {pro}</li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="bg-red-50 rounded-lg p-4 w-48">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✗</span>
              </div>
              <span className="font-semibold text-gray-900">Cons</span>
            </div>
            <ul className="space-y-2">
              {alt.cons.map((con, idx) => (
                <li key={idx} className="text-sm text-gray-700">• {con}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAlternatives = () => (
    <div className="space-y-6">
      {selectedAlternative ? (
        <>
          <button
            onClick={() => setSelectedAlternative(null)}
            className="flex items-center gap-2 text-violet-600 hover:text-violet-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to alternatives
          </button>
          {renderAlternativeCard(selectedAlternative, true)}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Alternatives ({alternatives.length})</h3>
            {rfcData.status === 'UNDER_REVIEW' && rfcData.isAuthor ? (
              <button
                onClick={() => setShowNewAlternativeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                <Plus className="w-5 h-5" />
                Add Alternative
              </button>
            ) : null}
          </div>

          {alternatives.length > 0 ? (
            <>
              {alternatives.map((alt) => renderAlternativeCard(alt))}
            </>
          ) : (
            <p className="text-gray-500 italic">No alternatives have been proposed yet.</p>
          )}
        </>
      )}
    </div>
  )

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6 mt-4'}`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-gray-900">{comment.author}</span>
          <span className="text-sm text-gray-500">{comment.date}</span>
        </div>
        <p className="text-gray-700 mb-3">{comment.content}</p>
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-600 hover:text-gray-900">Reply</button>
        </div>
      </div>
      {comment.replies?.map((reply) => renderComment(reply, false))}
    </div>
  )

  const renderDiscussion = () => (
    <div className="space-y-6">
      {/* New Comment */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <textarea
          placeholder="Add a comment..."
          value={newCommentContent}
          onChange={(e) => setNewCommentContent(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          rows={3}
          disabled={isPostingComment}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePostComment}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            disabled={isPostingComment || !newCommentContent.trim()}
          >
            {isPostingComment ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Comments */}
      <div>
        {clientComments.length > 0 ? (
          clientComments.map((comment) => renderComment(comment))
        ) : (
          <p className="text-gray-500 italic">Be the first to comment on this RFC.</p>
        )}
      </div>
    </div>
  )

  const renderCreateAdrModal = () => {
    if (!showAdrModal || !winningAlternative) return null;

    return (
      <div
        onClick={() => !isSubmittingAdr && setShowAdrModal(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto my-8 border-2 border-violet-600"
        >
          {/* Modal Header */}
          <div className="p-6 border-b relative">
            <h2 className="text-2xl font-bold text-center text-gray-900">Create New ADR from Decision</h2>
            <p className="text-center text-gray-600 mt-1">
              Finalizing decision for alternative: <strong>{winningAlternative.title}</strong>
            </p>
            <button
              onClick={() => !isSubmittingAdr && setShowAdrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label htmlFor="adr-title" className="block text-sm font-semibold text-gray-900 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="adr-title"
                value={adrFormData.title}
                onChange={(e) => setAdrFormData({ ...adrFormData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSubmittingAdr}
              />
            </div>

            {/* Context */}
            <div>
              <label htmlFor="adr-context" className="block text-sm font-semibold text-gray-900 mb-2">
                Context <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adr-context"
                value={adrFormData.context}
                onChange={(e) => setAdrFormData({ ...adrFormData, context: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                disabled={isSubmittingAdr}
              />
            </div>

            {/* Decision */}
            <div>
              <label htmlFor="adr-decision" className="block text-sm font-semibold text-gray-900 mb-2">
                Decision <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adr-decision"
                value={adrFormData.decision}
                onChange={(e) => setAdrFormData({ ...adrFormData, decision: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                disabled={isSubmittingAdr}
              />
            </div>

            {/* Consequences */}
            <div>
              <label htmlFor="adr-consequences" className="block text-sm font-semibold text-gray-900 mb-2">
                Consequences <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adr-consequences"
                value={adrFormData.consequences}
                onChange={(e) => setAdrFormData({ ...adrFormData, consequences: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                disabled={isSubmittingAdr}
                placeholder="Describe the consequences of this decision..."
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdrModal(false)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                disabled={isSubmittingAdr}
              >
                Cancel
              </button>
              
              <button
                onClick={() => { if (winningAlternative) fetchGeneratedAdr(winningAlternative.id) }}
                className="px-4 py-2 bg-sky-600 text-white border border-gray-300 rounded-lg hover:bg-sky-700 disabled:opacity-50"
                disabled={isGeneratingAdr || isSubmittingAdr}
              >
                {isGeneratingAdr ? 'Regenerating...' : 'Regenerate from LLM'}
              </button>
            </div>

            <button
              onClick={handleSubmitAdr}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-400"
              disabled={isSubmittingAdr || !adrFormData.title || !adrFormData.context || !adrFormData.decision || !adrFormData.consequences}
            >
              {isSubmittingAdr ? 'Saving ADR...' : 'Save ADR & Close RFC'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">{rfcData.title}</h1>
      <p className="text-lg text-center text-gray-500 mb-8">
        RFC #{rfcData.id} | Author: {rfcData.authorName} | Status: {rfcData.status.replace(/_/g, ' ')}
      </p>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('presentation')}
            className={`flex items-center gap-2 pb-4 transition-colors ${activeTab === 'presentation'
              ? 'text-violet-700 border-b-2 border-violet-700'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Presentation</span>
          </button>
          <button
            onClick={() => setActiveTab('alternatives')}
            className={`flex items-center gap-2 pb-4 transition-colors ${activeTab === 'alternatives'
              ? 'text-violet-700 border-b-2 border-violet-700'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Lightbulb className="w-5 h-5" />
            <span className="font-medium">Alternatives ({alternatives.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center gap-2 pb-4 transition-colors ${activeTab === 'discussion'
              ? 'text-violet-700 border-b-2 border-violet-700'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Discussion ({comments.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'presentation' && renderPresentation()}
        {activeTab === 'alternatives' && renderAlternatives()}
        {activeTab === 'discussion' && renderDiscussion()}
      </div>

      {/* New Alternative Modal */}
      {showNewAlternativeModal && (
        <div
          onClick={() => !isSubmittingAlternative && setShowNewAlternativeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border-2 border-violet-600"
          >
            <div className="p-8 border-b">
              <h2 className="text-3xl font-bold text-center text-gray-900">Add New Alternative</h2>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label htmlFor="alt-title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="alt-title"
                  type="text"
                  value={alternativeForm.title}
                  onChange={(e) => setAlternativeForm({ ...alternativeForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={isSubmittingAlternative}
                />
              </div>

              <div>
                <label htmlFor="alt-description" className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="alt-description"
                  value={alternativeForm.description}
                  onChange={(e) => setAlternativeForm({ ...alternativeForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  disabled={isSubmittingAlternative}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="alt-pros" className="block text-sm font-semibold text-gray-900 mb-2">Pros</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {alternativeForm.pros.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        <span>{p}</span>
                        <button type="button" onClick={() => removeProsItem(idx)} className="text-green-600 hover:text-green-800">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="alt-pros"
                      type="text"
                      value={alternativeForm.prosInput}
                      onChange={(e) => setAlternativeForm(prev => ({ ...prev, prosInput: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProsItem() } }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={isSubmittingAlternative}
                      placeholder="Pro"
                    />
                    <button type="button" onClick={addProsItem} className="px-3 py-2 bg-green-600 text-white rounded-full disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="alt-cons" className="block text-sm font-semibold text-gray-900 mb-2">Cons</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {alternativeForm.cons.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        <span>{c}</span>
                        <button type="button" onClick={() => removeConsItem(idx)} className="text-red-600 hover:text-red-800">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="alt-cons"
                      type="text"
                      value={alternativeForm.consInput}
                      onChange={(e) => setAlternativeForm(prev => ({ ...prev, consInput: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addConsItem() } }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={isSubmittingAlternative}
                      placeholder="Con"
                    />
                    <button type="button" onClick={addConsItem} className="px-3 py-2 bg-red-600 text-white rounded-full disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
                  disabled={isSubmittingAlternative}
                >
                  <Paperclip className="w-5 h-5" />
                  <span className="font-medium">Add Attachments</span>
                </button>
              </div>
            </div>

            <div className="p-6 flex items-center justify-between">
              <button
                onClick={handleCancelAlternative}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                disabled={isSubmittingAlternative}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Cancel
              </button>
              <button
                onClick={handleSubmitAlternative}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-400 disabled:cursor-not-allowed"
                disabled={isSubmittingAlternative || !alternativeForm.title || !alternativeForm.description}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {isSubmittingAlternative ? 'Submitting...' : 'Submit Alternative'}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderCreateAdrModal()}
    </div>
  )
}