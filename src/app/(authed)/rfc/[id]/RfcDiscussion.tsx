import { useEffect, useState } from "react";
import { Mention, MentionsInput } from "react-mentions";
import { BackendRFC, User } from "./page";
import fetcher from "@/src/lib/fetcher";
import CommentZone from "@/src/components/ui/Comment";

export default function RfcDiscussion({ rfcData, fetchRfcData, users }: {
  rfcData: BackendRFC;
  fetchRfcData: () => Promise<void>;
  users: User[];
}) {
  const rfcId = rfcData.id;
  const [newCommentContent, setNewCommentContent] = useState('')
  const [mentions, setMentions] = useState<number[]>([])
  const [isPostingComment, setIsPostingComment] = useState(false)

  useEffect(() => {
    const regex = /@\[(.*?)\]\((.*?)\)/g;
    const matches = [...newCommentContent.matchAll(regex)];
    const newMentions = matches.map(match => Number(match[2]));// ID de la mention;
    (() => setMentions(newMentions))();
  }, [newCommentContent]);

  const handlePostComment = async (content: string, mentions:number[], parentId: number | null = null) => {
    if (isPostingComment) return
    if (!rfcId) return
    if (!content || content.trim().length === 0) return

    const payload = {
      content: content.trim(),
      parentId,
      mentions
    }

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

      await fetchRfcData()
      setNewCommentContent('')
    } catch (e) {
      console.error('Posting comment failed:', e)
      alert('Failed to post comment. See console for details.')
    } finally {
      setIsPostingComment(false)
    }
  }


  return (
      <div className="space-y-6">
        <hr className="mt-10"></hr>
        <h2 className="text-2xl font-semibold text-violet-700 mb-4">Discussion</h2>
        <div className="bg-white border text-black border-gray-200 rounded-lg p-4">
            <MentionsInput
                className="mentions"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="What's on your mind?"
            >
                <Mention
                    className="mention"

                    trigger="@"
                    data={users.map(m => ({
                        id: m.id,
                        display: `${m.firstname} ${m.lastName}`,
                    }))}
                    displayTransform={(_: string, display: string) => `@${display}`}
                    markup="@[__display__](__id__)"
                    appendSpaceOnAdd
                />
            </MentionsInput>
          <div className="flex justify-end mt-2">
            <button
              onClick={() => handlePostComment(newCommentContent, mentions)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              disabled={isPostingComment || !newCommentContent.trim()}
            >
              {isPostingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>

        <div>
          {rfcData.comments.length > 0 ? (
            rfcData.comments.map((comment) => <CommentZone key={comment.id} members={users.map(m => m)} handleSubmit={handlePostComment} comment={comment} isReply={false} />)
          ) : (
            <p className="text-gray-500 italic">Be the first to comment on this RFC.</p>
          )}
        </div>
      </div>
  )
}