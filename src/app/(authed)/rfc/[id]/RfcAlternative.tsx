import { useRef, useState } from "react";
import { ArrowLeft, Paperclip, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { AdrFormData, Alternative, AlternativeForm, Attachment, BackendRFC } from "./page";
import { parseDescription } from "@/src/lib/utils";
import DiagramViewer from "@/src/components/ui/diagramViewer";
import fetcher from "@/src/lib/fetcher";
import DrawIoEditorModal from '@/src/components/ui/DrawIoEditorModal'


type RfcAlternativeProps = {
  rfcData: BackendRFC;
  setRfcData: React.Dispatch<React.SetStateAction<BackendRFC | null>>;
  alternatives: Alternative[];
  fetchAlternativeAttachments: (altId: number) => Promise<void>;
  fetchRfcData: () => Promise<void>;
  altAttachments: Record<number, Attachment[]>;
  altDiagramXml: Record<number, string>;
  setAltDiagramXml: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function RfcAlternative({rfcData, setRfcData, alternatives, fetchAlternativeAttachments, fetchRfcData, altAttachments, altDiagramXml, setAltDiagramXml, setErrorMessage}: RfcAlternativeProps) {
  const [isSubmittingAlternative, setIsSubmittingAlternative] = useState(false)
  const [newAlternativeFiles, setNewAlternativeFiles] = useState<File[]>([]);
  const [newAlternativeDiagramXml, setNewAlternativeDiagramXml] = useState<string>("");
  const newAltFileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedAlternative, setSelectedAlternative] = useState<Alternative | null>(null)

  const [isNewAltEditorOpen, setIsNewAltEditorOpen] = useState(false);
  const [showNewAlternativeModal, setShowNewAlternativeModal] = useState(false)
  const [alternativeForm, setAlternativeForm] = useState<AlternativeForm>({ title: '', description: '', pros: [], cons: [], prosInput: '', consInput: '' })

  const [isDrawIoModalOpen, setIsDrawIoModalOpen] = useState(false)

  const [userVotes, setUserVotes] = useState<Record<number, boolean | null>>({})

  const [altNewFiles, setAltNewFiles] =
    useState<Record<number, File[]>>({});

  const [altUploading, setAltUploading] =
    useState<Record<number, boolean>>({});

  const [altEditingDiagram, setAltEditingDiagram] =
    useState<Record<number, boolean>>({})

  const [altSavingDiagram, setAltSavingDiagram] =
    useState<Record<number, boolean>>({})

  const [altAdding, setAltAdding] = useState<Record<number, boolean>>({})
  const [altAdditionInputs, setAltAdditionInputs] = useState<Record<number, string>>({})
  const [altEditingAddition, setAltEditingAddition] = useState<Record<number, boolean>>({})
  const [activeAltIdForModal, setActiveAltIdForModal] = useState<number | null>(null);

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
  
  const rfcId = rfcData?.id
  const isReviewer = true

  const handleAltFilesChange = (altId: number, files: FileList | null) => {
    if (!files) return;
    setAltNewFiles((prev) => ({
      ...prev,
      [altId]: Array.from(files),
    }));
  };

  const uploadAlternativeAttachments = async (altId: number) => {
    const files = altNewFiles[altId];
    if (!files || files.length === 0) return;

    setAltUploading((prev) => ({ ...prev, [altId]: true }));

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const res = await fetcher(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/alternatives/${altId}/attachments`,
        {
          method: "POST",
          body: fd,
        }
      );

      if (!res.ok) {
        throw new Error(
          `Upload alternative attachments failed (status ${res.status})`
        );
      }


      await fetchAlternativeAttachments(altId);

      setAltNewFiles((prev) => ({ ...prev, [altId]: [] }));
    } catch (e) {
      console.error("Upload alt attachments error:", e);
      alert("Could not upload attachments for this alternative.");
    } finally {
      setAltUploading((prev) => ({ ...prev, [altId]: false }));
    }
  };

  const handleDownloadAltAttachment = async (att: Attachment) => {
    try {
      const res = await fetcher(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/alternatives/attachments/${att.id}/download`,
        { method: "GET" }
      );

      if (!res.ok) {
        throw new Error(`Download failed (status ${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = att.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Alternative attachment download failed:", e);
      alert("Could not download alternative attachment.");
    }
  };

  const startEditingAlternativeDiagram = (altId: number) => {
    setAltEditingDiagram((prev) => ({ ...prev, [altId]: true }))
  }

  const cancelEditingAlternativeDiagram = (altId: number) => {
    setAltEditingDiagram((prev) => ({ ...prev, [altId]: false }))

  }

  const handleAltDiagramChange = (altId: number, value: string) => {
    setAltDiagramXml((prev) => ({ ...prev, [altId]: value }))
  }

  const handleSaveAlternativeDiagram = async (altId: number, xmlFromModal: string) => {
    setAltSavingDiagram((prev) => ({ ...prev, [altId]: true }))
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/alternatives/${altId}/diagram`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent: xmlFromModal }),
      })
      if (!res.ok) throw new Error(`Status: ${res.status}`)
      const updated = await res.json()
      setAltDiagramXml((prev) => ({ ...prev, [altId]: updated.xml || "" }))
      setActiveAltIdForModal(null)
    } catch (e) {
      console.error("Saving failed:", e)
    } finally {
      setAltSavingDiagram((prev) => ({ ...prev, [altId]: false }))
    }
  }
  // Submit an addition for a specific alternative
  const handleSubmitAltAddition = async (altId: number) => {
    if (!altId) return
    if (altAdding[altId]) return
    const text = altAdditionInputs[altId] ?? ''
    if (!text || text.trim().length === 0) return

    setAltAdding((prev) => ({ ...prev, [altId]: true }))
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/alternatives/${altId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addition: text.trim() })
      })

      if (!res.ok) throw new Error(`Failed to submit alternative addition (status ${res.status})`)

      await fetchRfcData()
      setAltAdditionInputs((prev) => ({ ...prev, [altId]: '' }))
      setAltEditingAddition((prev) => ({ ...prev, [altId]: false }))
    } catch (e) {
      console.error('Submitting alternative addition failed:', e)
      alert('Failed to submit alternative addition. See console for details.')
    } finally {
      setAltAdding((prev) => ({ ...prev, [altId]: false }))
    }
  }

  const startEditingAltAddition = (altId: number) => {
    const existing = rfcData?.alternatives.find((a) => a.id === altId)?.addition ?? ''
    setAltAdditionInputs((prev) => ({ ...prev, [altId]: existing }))
    setAltEditingAddition((prev) => ({ ...prev, [altId]: true }))
  }

  const cancelEditingAltAddition = (altId: number) => {
    setAltEditingAddition((prev) => ({ ...prev, [altId]: false }))
    setAltAdditionInputs((prev) => ({ ...prev, [altId]: '' }))
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
      cons: alternativeForm.cons.join(';'),
      // usamos el XML que el usuario haya pegado (o null)
      xml: newAlternativeDiagramXml || null,
    }

    const multipart = new FormData();
    multipart.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
    );

    newAlternativeFiles.forEach((file) => {
      multipart.append("files", file);
    });

    setIsSubmittingAlternative(true)
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/alternatives`, {
        method: 'POST',
        body: multipart
      })

      if (!res.ok) throw new Error(`Failed to create alternative (status ${res.status})`)

      await fetchRfcData();

      setShowNewAlternativeModal(false)
      setAlternativeForm({ title: '', description: '', pros: [], cons: [], prosInput: '', consInput: '' })
      setNewAlternativeFiles([])
      setNewAlternativeDiagramXml("")
    } catch (e) {
      console.error('Create alternative failed:', e)
      setErrorMessage("Failed to create alternative.");
    } finally {
      setIsSubmittingAlternative(false)
    }
  }


  const handleCancelAlternative = () => {
    if (isSubmittingAlternative) return
    setShowNewAlternativeModal(false)
    setAlternativeForm({ title: '', description: '', pros: [], cons: [], prosInput: '', consInput: '' })
    setNewAlternativeFiles([])
    setNewAlternativeDiagramXml("")
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

    try {
      await fetchGeneratedAdr(alt.id)
    } catch (e) {
      console.log(`Failed to fetch generated ADR:`, e)

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
      rfcId: rfcId
    };

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
            <h3 className="text-2xl font-semibold text-cdmsa-text-primary mb-4">Alternatives ({alternatives.length})</h3>
            {rfcData.status === 'UNDER_REVIEW' && rfcData.isAuthor ? (
              <button
                onClick={() => setShowNewAlternativeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover"
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

  const renderAlternativeCard = (alt: Alternative, isExpanded: boolean = false) => {
    return (
    <div
        key={alt.id}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
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
                        <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#8eb4eeff"/>
                        <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#83afd5ff"/>
                        <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#256a98ff"/>
                        <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#89befaff"/>
                        <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#63a2bfff"/>
                        <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5691daff"/>
                    </g>
                </svg>
            </div>
          </div>

          <div className="flex-1">
            <h3
              className="text-xl font-semibold text-cdmsa-text-primary mb-2 cursor-pointer hover:text-cdmsa-primary-hover"
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

            {/* Voting */}
            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={() => handleVoteForAlternative(alt.id, true)}
                disabled={!isReviewer || rfcData.status !== 'UNDER_REVIEW'}
                className="flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsUp
                  className={`w-5 h-5 ${userVotes[alt.id] === true
                    ? 'text-cdmsa-border'
                    : 'text-gray-400 hover:text-cdmsa-primary-hover'
                    }`}
                />
                <span className="text-sm text-gray-700">
                  {alt.upvotes}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleVoteForAlternative(alt.id, false)}
                disabled={!isReviewer || rfcData.status !== 'UNDER_REVIEW'}
                className="flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsDown
                  className={`w-5 h-5 ${userVotes[alt.id] === false
                    ? 'text-cdmsa-border'
                    : 'text-gray-400 hover:text-cdmsa-primary-hover'
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

          <div className="flex gap-4 flex-shrink-0">
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

        {(!altAttachments[alt.id] || altAttachments[alt.id].length == 0) && !rfcData.isAuthor ? (
          <></>
        ) : (
          <section className="mt-4 border-t border-gray-100 pt-3">
              <h3 className="text-sm font-semibold text-cdmsa-text-primary mb-2">
                Attachments
              </h3>

              {/* Attachment list */}
              {altAttachments[alt.id] && altAttachments[alt.id].length > 0 ? (
                <ul className="space-y-1">
                  {altAttachments[alt.id].map((att) => (
                    <li key={att.id} className="flex items-center gap-2">
                      <Paperclip className="w-3 h-3 text-cdmsa-primary" />
                      <button
                        type="button"
                        onClick={() => handleDownloadAltAttachment(att)}
                        className="text-cdmsa-primary hover:underline text-xs"
                      >
                        {att.fileName}
                      </button>
                      <span className="text-[10px] text-gray-500">
                        ({Math.round(att.size / 1024)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">
                  No attachments loaded.
                </p>
              )}

              {/* Add attachments only UNDER_REVIEW */}
              {rfcData.isAuthor && rfcData.status === "UNDER_REVIEW" && (
                <div className="mt-2 flex flex-col items-start gap-1">
                  <input
                    id={`alt-${alt.id}-attachments`}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      handleAltFilesChange(alt.id, e.target.files)
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(`alt-${alt.id}-attachments`)
                        ?.click()
                    }
                    className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg
                          bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
                    disabled={altUploading[alt.id]}
                  >
                    <Paperclip className="w-3 h-3" />
                    Add Attachments
                  </button>

                  {altNewFiles[alt.id] && altNewFiles[alt.id].length > 0 && (
                    <>
                      <p className="text-[11px] text-gray-500">
                        {altNewFiles[alt.id].length} file(s) ready to upload
                      </p>

                      {/* Upload */}
                      <button
                        type="button"
                        onClick={() => uploadAlternativeAttachments(alt.id)}
                        disabled={altUploading[alt.id]}
                        className="px-4 py-2 text-xs rounded-full
                        bg-cdmsa-secondary text-cdmsa-text-primary font-medium
                        hover:bg-cdmsa-sidebar disabled:opacity-50"
                      >
                        {altUploading[alt.id] ? "Uploading..." : "Upload attachments"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

      {/* Diagram section */}
      {(!altDiagramXml[alt.id] || altDiagramXml[alt.id].length == 0) && !rfcData.isAuthor ? (
          <></>
      ) : (
          <section className="mt-4 border-t border-gray-100 pt-3">
            <h3 className="text-sm font-semibold text-cdmsa-text-primary mb-2">
              Diagram
            </h3>

            <div className="space-y-2">
              {altDiagramXml[alt.id] && altDiagramXml[alt.id].length > 0 ? (
                  <>
                    <DiagramViewer xml={altDiagramXml[alt.id]} />
                    {rfcData.isAuthor && rfcData.status === 'UNDER_REVIEW' && (
                        <button
                            type="button"
                            onClick={() => {
                              setActiveAltIdForModal(alt.id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
                        >
                          Edit diagram
                        </button>
                    )}
                  </>
              ) : (
                  <>
                    <p className="text-xs text-gray-500">No diagram has been added for this alternative.</p>
                    {rfcData.isAuthor && rfcData.status === 'UNDER_REVIEW' && (
                        <button
                            type="button"
                            onClick={() => {
                              setActiveAltIdForModal(alt.id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
                        >
                          Add diagram
                        </button>
                    )}
                  </>
              )}
            </div>

            <DrawIoEditorModal
                isOpen={activeAltIdForModal === alt.id}
                initialXml={altDiagramXml[alt.id] || ''}
                onSave={(xml) => handleSaveAlternativeDiagram(alt.id, xml)}
                onClose={() => setActiveAltIdForModal(null)}
                title={`Alternative Diagram: ${alt.title}`}
            />
          </section>
      )}

        {/* Alternative addition (annex) */}
        {!alt.addition && !rfcData.isAuthor ? (
          <></>
        ) : (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <h4 className="text-sm font-semibold text-cdmsa-text-primary mb-2">Additional content</h4>
          {alt.addition ? (
            <div className="text-xs text-gray-700 whitespace-pre-line mb-2">
              {alt.addition}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-2">No additional content has been added to this alternative.</p>
          )}

          {rfcData.isAuthor && rfcData.status === "UNDER_REVIEW" && (
            <div className="mt-1 w-full">
              {!altEditingAddition[alt.id] ? (
                <button
                  type="button"
                  onClick={() => startEditingAltAddition(alt.id)}
                  className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg
                          bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
                >
                  {alt.addition ? 'Edit addition' : 'Add addition'}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={altAdditionInputs[alt.id] ?? ''}
                    onChange={(e) => setAltAdditionInputs(prev => ({ ...prev, [alt.id]: e.target.value }))}
                    rows={3}
                    placeholder="Append an addition to this alternative..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border resize-none"
                    disabled={!!altAdding[alt.id]}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitAltAddition(alt.id)}
                      disabled={!!altAdding[alt.id] || !(altAdditionInputs[alt.id] ?? '').trim()}
                      className="px-3 py-1.5 bg-cdmsa-secondary text-cdmsa-text-primary text-xs rounded-lg hover:bg-cdmsa-sidebar disabled:opacity-50"
                    >
                      {altAdding[alt.id] ? 'Saving...' : (alt.addition ? 'Save additional content' : 'Add Addition')}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEditingAltAddition(alt.id)}
                      disabled={!!altAdding[alt.id]}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    )
  }

  const renderCreateAdrModal = () => {
    if (!showAdrModal || !winningAlternative) return null;

    return (
      <div
        onClick={() => !isSubmittingAdr && setShowAdrModal(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
         className="bg-white w-full max-w-3xl rounded-lg shadow-lg 
           overflow-hidden max-h-[90vh] flex flex-col"

        >
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

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label htmlFor="adr-title" className="block text-sm font-semibold text-gray-900 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="adr-title"
                value={adrFormData.title}
                onChange={(e) => setAdrFormData({ ...adrFormData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border"
                disabled={isSubmittingAdr}
              />
            </div>

            <div>
              <label htmlFor="adr-context" className="block text-sm font-semibold text-gray-900 mb-2">
                Context <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adr-context"
                value={adrFormData.context}
                onChange={(e) => setAdrFormData({ ...adrFormData, context: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border resize-none"
                disabled={isSubmittingAdr}
              />
            </div>

            <div>
              <label htmlFor="adr-decision" className="block text-sm font-semibold text-gray-900 mb-2">
                Decision <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adr-decision"
                value={adrFormData.decision}
                onChange={(e) => setAdrFormData({ ...adrFormData, decision: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border resize-none"
                disabled={isSubmittingAdr}
              />
            </div>

            <div>
              <label htmlFor="adr-consequences" className="block text-sm font-semibold text-gray-900 mb-2">
                Consequences <span className="text-red-500">*</span>
              </label>
              <textarea
                id="adr-consequences"
                value={adrFormData.consequences}
                onChange={(e) => setAdrFormData({ ...adrFormData, consequences: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border resize-none"
                disabled={isSubmittingAdr}
                placeholder="Describe the consequences of this decision..."
              />
            </div>
          </div>

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
              className="px-6 py-2.5 bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover transition-colors"
              disabled={isSubmittingAdr || !adrFormData.title || !adrFormData.context || !adrFormData.decision || !adrFormData.consequences}
            >
              {isSubmittingAdr ? 'Saving ADR...' : 'Save ADR & Close RFC'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNewAlternativeModal = () => {
    return (
        <div
          onClick={() => !isSubmittingAlternative && setShowNewAlternativeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border-2 border-cdmsa-border overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b">
              <h2 className="text-3xl font-bold text-center text-gray-900">Add New Alternative</h2>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">

              <div>
                <label htmlFor="alt-title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="alt-title"
                  type="text"
                  value={alternativeForm.title}
                  onChange={(e) => setAlternativeForm({ ...alternativeForm, title: e.target.value })}
                  className="text-gray-900 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border"
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
                  className="text-gray-900 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border resize-none"
                  disabled={isSubmittingAlternative}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="alt-pros" className="block text-sm font-semibold text-gray-900 mb-2">Pros</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {alternativeForm.pros.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        <span className="text-gray-900">{p}</span>
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
                      className="text-gray-900 flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border"
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
                        <span className="text-gray-900">{c}</span>
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
                      className="text-gray-900 flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border"
                      disabled={isSubmittingAlternative}
                      placeholder="Con"
                    />
                    <button type="button" onClick={addConsItem} className="px-3 py-2 bg-red-600 text-white rounded-full disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Attachments for the NEW alternative */}
              <div>

                <div className="flex flex-col items-end gap-2">
                  <input
                    ref={newAltFileInputRef}
                    id="new-alt-attachments"
                    type="file"
                    multiple
                    className="hidden"
                    disabled={isSubmittingAlternative}
                    onChange={(e) => {
                      if (!e.target.files) return;
                      setNewAlternativeFiles(Array.from(e.target.files));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => newAltFileInputRef.current?.click()}
                    disabled={isSubmittingAlternative}
                    className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg
                          bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
                  >
                    <Paperclip className="w-4 h-4" />
                    Add attachments
                  </button>

                  {newAlternativeFiles.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {newAlternativeFiles.map((f) => f.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Diagram XML for the NEW alternative */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Diagram XML (optional)
                </label>

                <div className="flex flex-col items-start gap-2">
                  {newAlternativeDiagramXml ? (
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-green-600 font-medium">Diagram added!</span>
                        <button
                            type="button"
                            onClick={() => setIsNewAltEditorOpen(true)}
                            className="text-xs text-cdmsa-text-primary underline"
                        >
                          Edit diagram
                        </button>
                      </div>
                  ) : (
                      <button
                          type="button"
                          onClick={() => setIsNewAltEditorOpen(true)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
                      >
                        + Design Diagram
                      </button>
                  )}
                </div>

                <DrawIoEditorModal
                    isOpen={isNewAltEditorOpen}
                    initialXml={newAlternativeDiagramXml}
                    onSave={(xml) => setNewAlternativeDiagramXml(xml)}
                    onClose={() => setIsNewAltEditorOpen(false)}
                    title="New Alternative Diagram"
                />
              </div>

            </div>

            <div className="p-6 flex items-center justify-between">
              <button
                onClick={handleCancelAlternative}
                className="flex items-center gap-2 px-6 py-2.5 bg-cdmsa-secondary text-cdmsa-text-primary rounded-lg hover:bg-cdmsa-sidebar transition-colors disabled:opacity-50"
                disabled={isSubmittingAlternative}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Cancel
              </button>
              <button
                onClick={handleSubmitAlternative}
                className="flex items-center gap-2 px-6 py-2.5 bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover transition-colors disabled:cursor-not-allowed"
                disabled={isSubmittingAlternative || !alternativeForm.title || !alternativeForm.description}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {isSubmittingAlternative ? 'Submitting...' : 'Submit Alternative'}
              </button>
            </div>
          </div>
        </div>
    )
  }

  return (
    <div>
      {renderAlternatives()}
      {showNewAlternativeModal &&  renderNewAlternativeModal()}
      {renderCreateAdrModal()}
    </div>
  )
}