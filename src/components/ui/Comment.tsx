import React, { useState } from "react";
import { Comment } from "@/lib/types";
import { ParamValue } from "next/dist/server/request/params";

interface CommentZoneProps {
    comment: Comment;
    handleSubmit : (comment:string, parentId: number | null) => void;
    isReply?: boolean;
}

export default function CommentZone({comment, handleSubmit ,isReply = false} : CommentZoneProps): React.JSX.Element{
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [replyText, setReplyText] = useState<string>("");

    return (
        <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6 mt-4'}`}>
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 mb-3">{comment.content}</p>
                <div className="flex items-center gap-4">
                    <button className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setShowReplyForm(true)}>Reply</button>
                </div>
                {/* Reply Form */}
                {showReplyForm && (
                    <div className="mt-4 text-black">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
                        placeholder="Write your reply..."
                    />
                    <button
                        onClick={() => handleSubmit(replyText, comment.id)}
                        className="px-4 py-1 text-white rounded-lg bg-violet-600 hover:bg-violet-700"
                    >
                        Reply
                    </button
                    >
                    </div>
                    )
                }
            </div>
            {comment.replies?.map((reply) => <CommentZone key={reply.id} handleSubmit={handleSubmit} comment={reply} isReply={true}/>)}
        </div>
    )
}