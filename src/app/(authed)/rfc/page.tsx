"use client"
import { MessageCircle, Plus, X, Paperclip, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { parseDescription } from '@/lib/utils'
import Link from 'next/link'
import fetcher from '@/src/lib/fetcher'

interface BackendRFC {
  id: number;
  title: string;
  description: string;
  authorName: string;
  status: 'CLOSED_DECIDED' | 'CLOSED_NON_DECIDED' | 'UNDER_REVIEW';
  createdAt: string;
  comments: any[];
}

export default function RFCPage() {
  const [rfcs, setRfcs] = useState<BackendRFC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    context: '', // Not used in POST body, but kept for user input
    problemStatement: '' // Not used in POST body, but kept for user input
  });

  const getStatusColor = (status: BackendRFC['status']) => {
    switch (status) {
      case 'CLOSED_DECIDED':
      case 'CLOSED_NON_DECIDED':
        return 'bg-purple-200 text-purple-800';
      case 'UNDER_REVIEW':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const formatStatus = (status: BackendRFC['status']) => {
    return status.replace(/_/g, ' '); // Converts UNDER_REVIEW to UNDER REVIEW
  };

  const fetchRFCs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRfcs(data.content || []); // Assuming the list is in 'content'
    } catch (e) {
      console.error("Failed to fetch RFCs:", e);
      setError("Failed to load RFCs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFCs();
  }, []);


  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Use a combination of context and problemStatement for the 'description' field, split by RFCSPLIT
    const description = `Context: ${formData.context}\n---RFCSPLIT---\nProblem: ${formData.problemStatement}`;

    const postBody = {
      title: formData.title,
      description: description,
      templateId: 1, // Default value, only working with one template
    };

    setIsSubmitting(true);
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchRFCs();
      handleCancel(); // Resets form and closes modal
    } catch (e) {
      console.error('Failed to create RFC:', e);
      // You might want a toast/notification here for the user
      alert('Failed to submit new RFC. Check console for details.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormData({ title: '', context: '', problemStatement: '' });
  };

  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isModalOpen]);


  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Requests for Comments</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New RFC
        </button>
      </div>

      {/* RFC List */}
      <div className="space-y-4">
        {isLoading && <p className="text-gray-600">Loading RFCs...</p>}
        {error && <p className="text-red-500 font-medium">{error}</p>}
        
        {!isLoading && rfcs.length === 0 && !error && (
            <p className="text-gray-600">No RFCs found. Be the first to create one!</p>
        )}

        {rfcs.map((rfc) => {
          const { context, problem } = parseDescription(rfc.description)
          return (
          <Link
            key={rfc.id}
            href={`/rfc/${rfc.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg width="131" height="96" viewBox="0 0 131 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.6">
                        <line y1="-1.50402" x2="26.6757" y2="-1.50402"
                              transform="matrix(0.72131 -0.692613 0.691627 0.722255 44.282 82.0857)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.9282" y2="-1.50402"
                              transform="matrix(0.999747 0.022497 -0.0224356 0.999748 13.9697 54.8997)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.6837" y2="-1.50402"
                              transform="matrix(0.671888 0.740653 -0.739738 0.672895 33.4744 15.0444)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="38.7414" y2="-1.50402"
                              transform="matrix(0.646343 -0.763047 0.762175 0.647372 74.3296 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="41.2294" y2="-1.50402"
                              transform="matrix(0.990922 0.134438 -0.134077 0.990971 76.9661 58.8589)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="40.2477" y2="-1.50402"
                              transform="matrix(0.464978 -0.885322 0.884798 0.465975 10.0161 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#AEA9E8"/>
                        <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#C4B7FF"/>
                        <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#5E50A4"/>
                        <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#A67DFF"/>
                        <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#6A63BF"/>
                        <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5658DA"/>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {rfc.title}
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  {/* Using standard JS date format for simplicity */}
                  {new Date(rfc.createdAt).toLocaleDateString()}, by {rfc.authorName}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {context}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {problem}
                </p>
              </div>

              {/* Status and Comments. Comments are commented for now as the backend does not return it in this endpoint */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(rfc.status)}`}>
                  {formatStatus(rfc.status)}
                </span>
                {/* <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-lg font-medium">{rfc.comments?.length || 0}</span>
                </div> */}
              </div>
              </div>
          </Link>
          )
        })}
      </div>

      {/* Create RFC Modal */}
      {isModalOpen && (
        <div
          onClick={() => !isSubmitting && setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm backdrop-saturate-125"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border-2 border-violet-600"
          >
            {/* Modal Header */}
            <div className="p-8 border-b">
              <h2 className="text-3xl font-bold text-center text-gray-900">Create New RFC</h2>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
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
                <input
                  type="text"
                  id="context"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Problem Statement */}
              <div>
                <label htmlFor="problemStatement" className="block text-sm font-semibold text-gray-900 mb-2">
                  Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="problemStatement"
                  value={formData.problemStatement}
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  placeholder="Describe the issue or motivation behind this RFC"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Add Attachments Button */}
              <div className="flex justify-end">
                <button 
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <Paperclip className="w-5 h-5" />
                  <span className="font-medium">Add Attachments</span>
                </button>
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
                disabled={isSubmitting || !formData.title || !formData.context || !formData.problemStatement}
              >
                <Send className="w-5 h-5" />
                {isSubmitting ? 'Submitting...' : 'Submit for Discussion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}