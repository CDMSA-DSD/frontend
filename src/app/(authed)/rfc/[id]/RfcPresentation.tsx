import { useRef, useState } from "react";
import { parseDescription } from "@/src/lib/utils";
import { Attachment, BackendRFC, Context, User } from "./page";
import {Paperclip, Plus} from "lucide-react";
import Select, { MultiValue } from "react-select";
import DiagramViewer from "@/src/components/ui/diagramViewer";
import fetcher from "@/src/lib/fetcher";
import DrawIoEditorModal from '@/src/components/ui/DrawIoEditorModal'

type RfcPresentationProps = {
  rfcData: BackendRFC;
  setRfcData: React.Dispatch<React.SetStateAction<BackendRFC | null>>;
  fetchRfcData: () => Promise<void>;
  diagramXml: string;
  setDiagramXml: React.Dispatch<React.SetStateAction<string>>;
  setOkMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
  users: User[];
};

export default function RfcPresentation({ rfcData, setRfcData, fetchRfcData, diagramXml, setDiagramXml, setOkMessage, setErrorMessage, users }: RfcPresentationProps) {
  const { context: contextText, problem: problemText } = parseDescription(rfcData.description)
  const [showReviewersModal, setShowReviewersModal] = useState(false)
  const [isLoadingReviewerData, setIsLoadingReviewerData] = useState(false)
  const [newRfcAttachments, setNewRfcAttachments] = useState<File[]>([]);
  const [uploadingRfcAttachments, setUploadingRfcAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditingDiagram, setIsEditingDiagram] = useState(false)
  const [isSavingDiagram, setIsSavingDiagram] = useState(false)
  const [isEditingRfcAddition, setIsEditingRfcAddition] = useState(false)
  const [isAddingRfcAddition, setIsAddingRfcAddition] = useState(false)
  const [rfcAdditionInput, setRfcAdditionInput] = useState('')

  const [isAssigningReviewers, setIsAssigningReviewers] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectedContextIds, setSelectedContextIds] = useState<number[]>([])
  const [availableContexts, setAvailableContexts] = useState<Context[]>([])

  const [isDrawIoModalOpen, setIsDrawIoModalOpen] = useState(false)

  const [isClosing, setIsClosing] = useState(false)

  const rfcId = rfcData?.id

  const startEditingRfcAddition = () => {
    setRfcAdditionInput(rfcData?.addition ?? '')
    setIsEditingRfcAddition(true)
  }

  const cancelEditingRfcAddition = () => {
    setIsEditingRfcAddition(false)
    setRfcAdditionInput('')
  }

  const handleDownloadAttachment = async (att: Attachment) => {
    try {
      const res = await fetcher(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/attachments/${att.id}/download`,
        {
          method: "GET",
        }
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
      console.error("Attachment download failed:", e);
      alert("Could not download attachment.");
    }
  };

  const handleUploadRfcAttachments = async () => {
    if (!rfcId || newRfcAttachments.length === 0) return;

    setUploadingRfcAttachments(true);
    try {
      const fd = new FormData();
      newRfcAttachments.forEach((file) => {
        fd.append("files", file);
      });

      const res = await fetcher(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/attachments`,
        {
          method: "POST",
          body: fd,
        }
      );

      if (!res.ok) {
        throw new Error(`Upload failed (status ${res.status})`);
      }

      await fetchRfcData();
      setNewRfcAttachments([]);
    } catch (e) {
      console.error("Upload RFC attachments failed:", e);
      alert("Failed to upload attachments.");
    } finally {
      setUploadingRfcAttachments(false);
    }
  };

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

  const handleSaveDiagram = async (xmlFromModal: string) => {
    if (!rfcId) return
    setIsSavingDiagram(true)
    try {
      const res = await fetcher(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/diagram`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ xmlContent: xmlFromModal }), // Usiamo l'XML della modale
          }
      )
      if (!res.ok) throw new Error(`Status: ${res.status}`)

      const updated: BackendRFC = await res.json()
      setRfcData(updated)
      setDiagramXml(updated.xml ?? "")
      setOkMessage("Diagram saved!")
    } catch (e) {
      console.error("Saving faild:", e)
      setErrorMessage("Error in saving the diagram.")
    } finally {
      setIsSavingDiagram(false)
      setIsDrawIoModalOpen(false)
    }
  }


  const handleSubmitRfcAddition = async () => {
    if (!rfcId || isAddingRfcAddition) return
    if (!rfcAdditionInput || rfcAdditionInput.trim().length === 0) return

    setIsAddingRfcAddition(true)
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: rfcData?.title, description: rfcData?.description, addition: rfcAdditionInput.trim() })
      })

      if (!res.ok) throw new Error(`Failed to submit addition (status ${res.status})`)

      // refresh
      await fetchRfcData()
      setRfcAdditionInput('')
      setIsEditingRfcAddition(false)
    } catch (e) {
      console.error('Submitting RFC addition failed:', e)
      alert('Failed to submit addition. See console for details.')
    } finally {
      setIsAddingRfcAddition(false)
    }
  }

  const handleOpenReviewersModal = async () => {
    setShowReviewersModal(true)
    setIsLoadingReviewerData(true)
    
    if (rfcData) {
      setSelectedUserIds(rfcData.userReviewers?.map(r => r.id) || [])
      setSelectedContextIds(rfcData.contextReviewers?.map(r => r.id) || [])
    }

    try {
      const contextsRes = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/contexts`)
      if (contextsRes.ok) {
        const contexts = await contextsRes.json()
        setAvailableContexts(contexts)
      }
    } catch (e) {
      console.error('Failed to load reviewers data:', e)
    } finally {
      setIsLoadingReviewerData(false)
    }
  }

  const handleAssignReviewers = async () => {
    if (isAssigningReviewers || !rfcId) return

    setIsAssigningReviewers(true)
    try {
      const res = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rfcs/${rfcId}/reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
          contextIds: selectedContextIds
        })
      })

      if (!res.ok) {
        throw new Error(`Failed to assign reviewers (status ${res.status})`)
      }

      await fetchRfcData()
      setShowReviewersModal(false)
    } catch (e) {
      console.error('Failed to assign reviewers:', e)
      alert('Failed to assign reviewers. See console for details.')
    } finally {
      setIsAssigningReviewers(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-cdmsa-text-primary mb-4">Context</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {contextText || rfcData.description}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-cdmsa-text-primary mb-4">Problem</h2>
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

      {/* RFC Attachments */}
      {(!rfcData.attachments || rfcData.attachments.length == 0) && !rfcData.isAuthor ? (
        <></>
      ) : (
      <section>
        <h2 className="text-2xl font-semibold text-cdmsa-text-primary mb-4">
          Attachments
        </h2>

        {rfcData.attachments && rfcData.attachments.length > 0 ? (
          <ul className="space-y-2">
            {rfcData.attachments.map((att) => (
              <li key={att.id} className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cdmsa-primary" />
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(att)}
                  className="text-cdmsa-primary hover:underline text-sm"
                >
                  {att.fileName}
                </button>
                <span className="text-xs text-gray-500">
                  ({Math.round(att.size / 1024)} KB)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No attachments.</p>
        )}


        {rfcData.isAuthor && rfcData.status === "UNDER_REVIEW" && (
          <div className="mt-4 space-y-2">

            <input
              ref={fileInputRef}
              id="rfc-more-attachments"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (!e.target.files) return;
                setNewRfcAttachments(Array.from(e.target.files));
              }}
              disabled={uploadingRfcAttachments}
            />

            {/* button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg
                        bg-cdmsa-primary text-white hover:bg-cdmsa-primary-hover"
              disabled={uploadingRfcAttachments}
            >
              <Paperclip className="w-4 h-4" />
              Add attachments
            </button>

            {newRfcAttachments.length > 0 && (
              <>
                <p className="text-xs text-gray-500">
                  {newRfcAttachments.length} file(s) ready to upload
                </p>

                <button
                  type="button"
                  onClick={handleUploadRfcAttachments}
                  disabled={uploadingRfcAttachments}
                  className="px-4 py-2 text-sm rounded-full
      bg-cdmsa-secondary text-cdmsa-text-primary font-medium
      hover:bg-cdmsa-sidebar disabled:opacity-50"
                >
                  {uploadingRfcAttachments ? "Uploading..." : "Upload attachments"}
                </button>
              </>
            )}

          </div>
        )}
      </section>
      )}

      {/* Diagram with draw.io */}
      {(!rfcData.xml && !rfcData.isAuthor) ? null : (
          <section className="border-t border-gray-100 pt-8">
            <h2 className="text-2xl font-bold text-cdmsa-text-primary mb-6 text-center md:text-left">Architecture Diagram</h2>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {rfcData.xml ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-gray-50 rounded-lg border border-gray-100 min-h-[300px] flex items-center justify-center p-4">
                      <DiagramViewer xml={rfcData.xml} />
                    </div>
                    {rfcData.isAuthor && rfcData.status === 'UNDER_REVIEW' && (
                        <div className="flex justify-end">
                          <button
                              type="button"
                              onClick={() => setIsDrawIoModalOpen(true)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover transition-all font-medium shadow-md"
                          >
                            Edit architecture diagram
                          </button>
                        </div>
                    )}
                  </div>
              ) : (
                  <div className="p-12 text-center bg-gray-50/50">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="text-gray-400 w-8 h-8" />
                    </div>
                    <p className="text-gray-500 mb-6">A visual diagram helps reviewers understand your proposal better.</p>
                    {rfcData.isAuthor && rfcData.status === 'UNDER_REVIEW' && (
                        <button
                            type="button"
                            onClick={() => setIsDrawIoModalOpen(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg shadow-green-100"
                        >
                          + Create architecture diagram
                        </button>
                    )}
                  </div>
              )}
            </div>

            <DrawIoEditorModal
                isOpen={isDrawIoModalOpen}
                initialXml={diagramXml}
                onSave={handleSaveDiagram}
                onClose={() => setIsDrawIoModalOpen(false)}
                title={`Editor: ${rfcData.title}`}
            />
          </section>
      )}

      {/* RFC addition (annex) */}
      {!rfcData.addition && !rfcData.isAuthor ? (
        <></>
      ) : (
        <section>
          <h2 className="text-2xl font-semibold text-cdmsa-text-primary mb-4">Additional Content</h2>

          <div className="prose text-gray-700 whitespace-pre-line mb-4">
            {rfcData.addition ? (
              <div className="text-gray-700 whitespace-pre-line">{rfcData.addition}</div>
            ) : (
              <p className="text-sm text-gray-500">No additional content has been added to this RFC.</p>
            )}
          </div>

          {rfcData.isAuthor && rfcData.status === "UNDER_REVIEW" && (
            <div className="mt-2">
              {!isEditingRfcAddition ? (
                <div>
                  <button
                    onClick={startEditingRfcAddition}
                    className="px-4 py-2 text-sm rounded-lg bg-cdmsa-primary text-white
                    hover:bg-cdmsa-primary-hover disabled:opacity-50"
                  >
                    {rfcData.addition ? 'Edit additional content' : 'Add additional content'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <textarea
                    placeholder="Append an addition / annex paragraph to this RFC..."
                    value={rfcAdditionInput}
                    onChange={(e) => setRfcAdditionInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cdmsa-border resize-none"
                    rows={4}
                    disabled={isAddingRfcAddition}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitRfcAddition}
                      disabled={isAddingRfcAddition || !rfcAdditionInput.trim()}
                      className="px-4 py-2 bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover disabled:opacity-50"
                    >
                      {isAddingRfcAddition ? 'Saving...' : (rfcData.addition ? 'Save' : 'Add additional content')}
                    </button>
                    <button
                      onClick={cancelEditingRfcAddition}
                      disabled={isAddingRfcAddition}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Reviewers */}
      {(!rfcData.userReviewers || rfcData.userReviewers.length === 0) && 
        (!rfcData.contextReviewers || rfcData.contextReviewers.length === 0) && 
        !rfcData.isAuthor ? (
        <></>
      ) : (
        <section>
          <h2 className="text-2xl font-semibold text-cdmsa-text-primary">Reviewers</h2>

          {rfcData.isAuthor && rfcData.status === "UNDER_REVIEW" && (
            <div className="mt-2 mb-4">
              <button
                onClick={handleOpenReviewersModal}
                className="px-4 py-2 text-sm rounded-lg bg-cdmsa-primary text-white
                hover:bg-cdmsa-primary-hover disabled:opacity-50"
              >
                Manage Reviewers
              </button>
            </div>
          )}

          <div className="space-y-4 mb-4">
            {rfcData.userReviewers && rfcData.userReviewers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Individual Reviewers</h3>
                <div className="flex flex-wrap gap-2">
                  {rfcData.userReviewers.map(reviewer => (
                    <div key={reviewer.id} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      {reviewer.firstname} {reviewer.lastName} ({reviewer.email})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rfcData.contextReviewers && rfcData.contextReviewers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Context Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {rfcData.contextReviewers.map(context => (
                    <div key={context.id} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      {context.name} {context.type && `(${context.type})`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!rfcData.userReviewers || rfcData.userReviewers.length === 0) && 
              (!rfcData.contextReviewers || rfcData.contextReviewers.length === 0) && (
              <p className="text-sm text-gray-500">No reviewers assigned yet.</p>
            )}
          </div>
        </section>
      )}

      {rfcData.status === 'UNDER_REVIEW' && rfcData.isAuthor && (
        <button
          onClick={handleCloseNoDecision}
          disabled={isClosing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isClosing ? 'Closing...' : 'Close RFC (No Decision)'}
        </button>
      )}

      {showReviewersModal && (
        <div
          onClick={() => !isAssigningReviewers && setShowReviewersModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8 border-2 border-cdmsa-border"
          >
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-center text-gray-900">Manage Reviewers</h2>
              <p className="text-center text-gray-600 mt-1">
                Assign individual reviewers and context groups to this RFC
              </p>
            </div>

            <div className="p-6 max-h-[60vh]">
              {isLoadingReviewerData ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading reviewers...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Individual Reviewers</h3>
                    <Select
                      isMulti
                      isDisabled={isAssigningReviewers}
                      options={users.map(user => ({
                        value: user.id,
                        label: `${user.firstname} ${user.lastName} (${user.email})`
                      }))}
                      value={users.filter(u => selectedUserIds.includes(u.id)).map(user => ({
                        value: user.id,
                        label: `${user.firstname} ${user.lastName} (${user.email})`
                      }))}
                      onChange={(selected: MultiValue<{ value: number; label: string }>) => {
                        setSelectedUserIds(selected.map(opt => opt.value));
                      }}
                      placeholder={users.length > 0 ? "Select reviewers..." : "No users available"}
                      classNamePrefix="react-select"
                      styles={{
                        container: (base) => ({ ...base, minHeight: 0 }),
                        menu: (base) => ({ ...base, zIndex: 50 }),
                        valueContainer: (base) => ({ ...base, maxHeight: '160px', overflowY: 'auto' })
                      }}
                      className="text-gray-900"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Context Groups</h3>
                    <Select
                      isMulti
                      isDisabled={isAssigningReviewers}
                      options={availableContexts.map(context => ({
                        value: context.id,
                        label: context.name
                      }))}
                      value={availableContexts.filter(c => selectedContextIds.includes(c.id)).map(context => ({
                        value: context.id,
                        label: context.name
                      }))}
                      onChange={(selected: MultiValue<{ value: number; label: string }>) => {
                        setSelectedContextIds(selected.map(opt => opt.value));
                      }}
                      placeholder={availableContexts.length > 0 ? "Select context groups..." : "No context groups available"}
                      classNamePrefix="react-select"
                      styles={{
                        container: (base) => ({ ...base, minHeight: 0 }),
                        menu: (base) => ({ ...base, zIndex: 50 }),
                        valueContainer: (base) => ({ ...base, maxHeight: '160px', overflowY: 'auto' })
                      }}
                      className="text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowReviewersModal(false)}
                className="px-6 py-2.5 bg-cdmsa-secondary text-cdmsa-text-primary rounded-lg hover:bg-cdmsa-sidebar transition-colors disabled:opacity-50"
                disabled={isAssigningReviewers}
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedUserIds.length + selectedContextIds.length} selected
                </span>
                <button
                  onClick={handleAssignReviewers}
                  className="px-6 py-2.5 bg-cdmsa-primary text-white rounded-lg hover:bg-cdmsa-primary-hover transition-colors"
                  disabled={isAssigningReviewers || isLoadingReviewerData}
                >
                  {isAssigningReviewers ? 'Assigning...' : 'Assign Reviewers'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}