"use client"
import { FileText, Lightbulb, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import fetcher from '@/src/lib/fetcher'
import { Comment } from '@/lib/types'
import ErrorBanner from "@/src/components/ui/errorBanner"
import OkBanner from "@/src/components/ui/okBanner"
import RfcPresentation from './RfcPresentation'
import RfcAlternative from './RfcAlternative'
import RfcDiscussion from './RfcDiscussion'

interface BackendAlternative {
  id: number
  title: string
  description: string
  pros: string
  cons: string
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string | null
  yes: number
  no: number
  addition?: string | null
}

export interface BackendRFC {
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
  isReviewer: boolean
  alternatives: BackendAlternative[]
  comments: Comment[],
  userReviewers?: Array<User>
  contextReviewers?: Array<Context>
  isWatching?:boolean // remove "?" when backend implemented
  xml: string | null
  attachments: Attachment[]
  addition?: string | null
}

export type User = {
  id: number,
  firstname: string,
  lastName: string,
  email: string,
  contextAdmin: boolean
  userReviewers?: Array<User>
  contextReviewers?: Array<Context>
}

export interface Context {
  id: number
  name: string
  type: string
  description: string
}

type TabType = 'presentation' | 'alternatives' | 'discussion'

export interface Alternative {
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
  addition?: string | null
}

export interface AlternativeForm {
  title: string
  description: string
  pros: string[]
  cons: string[]
  prosInput: string
  consInput: string
}

export interface AdrFormData {
  title: string
  context: string
  decision: string
  consequences: string
}

export interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
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
  attachments: backendAlt.id === 1 ? ['document1.pdf', 'diagram.png'] : [],
  addition: backendAlt.addition ?? null
})

export default function RFCDetailPage() {
  const params = useParams()
  const rfcId = params.id


  const [activeTab, setActiveTab] = useState<TabType>('presentation')

  const [rfcData, setRfcData] = useState<BackendRFC | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [okMessage, setOkMessage] = useState<string | null>(null)

  const [isNewAltEditorOpen, setIsNewAltEditorOpen] = useState(false);

  const alternatives: Alternative[] = rfcData ? rfcData.alternatives.map(mapAlternative) : []

  const [diagramXml, setDiagramXml] = useState<string>('')

  const [altAttachments, setAltAttachments] =
    useState<Record<number, Attachment[]>>({});

  const [altDiagramXml, setAltDiagramXml] =
    useState<Record<number, string>>({})

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!rfcId) return;
    fetchRfcData()
    fetchUsers()
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
      setDiagramXml(data.xml ?? '')


      if (data.alternatives && data.alternatives.length > 0) {
        await Promise.all(
          data.alternatives.map((alt) =>
            fetchAlternativeAttachments(alt.id, false)
          )
        );
      }
    } catch (e) {
      console.error("Fetching RFC failed:", e)
      setError(e instanceof Error ? e.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlternativeAttachments = async (altId: number, showAlert = true) => {
    try {
      const res = await fetcher(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/alternatives/${altId}`,
        { method: "GET" }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load alternative ${altId} (status ${res.status})`
        );
      }

      const data = await res.json();
      setAltAttachments((prev) => ({
        ...prev,
        [altId]: data.attachments || [],
      }));

      setAltDiagramXml(prev => ({
        ...prev,
        [altId]: data.xml || '',
      }))


    } catch (e) {
      console.error("Failed to fetch alternative attachments:", e);
      if (showAlert) {
        alert("Could not load alternative attachments.");
      }
    }
  };

  const fetchUsers = async () : Promise<void> => {
    try {
      const res = await fetcher(process.env.NEXT_PUBLIC_BACKEND_URL + "/users?page=0&size=100");
      if (res.ok) {
        const data = await res.json();
        setUsers(data._embedded?.users);
      }
      else throw new Error("Could not find members");
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubscribe = async () => {
    try{
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/subscribe`, {
          method:"POST",
          headers: {
              'Content-Type': 'application/json'
          },
      })
      if(res.ok) {
        setRfcData((prev: BackendRFC | null): BackendRFC => ({...prev!, isWatching: true}))
        setErrorMessage(null)
        setOkMessage("You have successfully subscribed to " + rfcData?.title)
      }
      else {
        const data : {message:string} = await res.json()
        setOkMessage(null)
        setOkMessage(data.message)
      }
    }
    catch(e){
      console.log(e)
    }
  }

  // Add a button to navigate to the Discussion section
  const scrollToDiscussion = () => {
    const discussionSection = document.getElementById("discussion-section");
    if (discussionSection) {
      discussionSection.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="min-h-screen bg-white p-8">
      <ErrorBanner text={errorMessage}/>
      <OkBanner text={okMessage}/>
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">{rfcData.title}</h1>
      <p className="text-lg text-center text-gray-500 mb-4">
        RFC #{rfcData.id} | Author: {rfcData.authorName} | Status: {rfcData.status.replace(/_/g, ' ')} {rfcData.isWatching? "| 👁️ Watched" : "| "}
          {!rfcData.isWatching && (
              <button
                  onClick={handleSubscribe}
                  className=" justify-center px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                  Subscribe
              </button>
          )}

      </p>

      <div className="flex justify-center mb-4">
        <button
          onClick={scrollToDiscussion}
          className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700"
        >
          Go to Discussion
        </button>
      </div>

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
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'presentation' && <RfcPresentation rfcData={rfcData} setRfcData={setRfcData} fetchRfcData={fetchRfcData} diagramXml={diagramXml} setDiagramXml={setDiagramXml} setOkMessage={setOkMessage} setErrorMessage={setErrorMessage} users={users} />}
        {activeTab === 'alternatives' && <RfcAlternative rfcData={rfcData} setRfcData={setRfcData} alternatives={alternatives} fetchAlternativeAttachments={fetchAlternativeAttachments} fetchRfcData={fetchRfcData} altAttachments={altAttachments} altDiagramXml={altDiagramXml} setAltDiagramXml={setAltDiagramXml} setErrorMessage={setErrorMessage} />}
        <div id="discussion-section">
          <RfcDiscussion rfcData={rfcData} fetchRfcData={fetchRfcData} users={users} />
        </div>
      </div>
    </div>
  )
}