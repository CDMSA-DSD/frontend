import React, {useEffect, useState} from "react";
import { Comment } from "@/lib/types";
import { ParamValue } from "next/dist/server/request/params";
import {Mention, MentionsInput} from "react-mentions";

interface CommentZoneProps {
    comment: Comment;
    handleSubmit : (comment:string, mentions:{id:string}[], parentId: number | null) => void;
    members:{id:number, firstname:string, lastName:string}[]
    isReply?: boolean;
}

export default function CommentZone({comment, handleSubmit, members ,isReply = false} : CommentZoneProps): React.JSX.Element{
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [replyText, setReplyText] = useState<string>("");
    const [mentions, setMentions] = useState<{id:string}[]>([]);

    useEffect(() => {
        const regex = /@\[(.*?)\]\((.*?)\)/g;
        const matches = [...replyText.matchAll(regex)];
        const newMentions = matches.map((match) => ({
            id: match[2].toString(), // ID de la mention
        }));
        (() => setMentions(newMentions))();
    }, [replyText]);

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
                        <MentionsInput
                            className="mentions"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="What's on your mind?"
                        >
                            <Mention
                                className="mention"
                                trigger="@"
                                data={members.map(m => ({
                                    id: m.id,
                                    display: `${m.firstname} ${m.lastName}`,
                                }))}
                                displayTransform={(_: string, display: string) => `@${display}`}
                                markup="@[__display__](__id__)"
                                appendSpaceOnAdd
                            />
                        </MentionsInput>
                    <button
                        onClick={() => handleSubmit(replyText, mentions, comment.id)}
                        className="px-4 py-1 text-white rounded-lg bg-violet-600 hover:bg-violet-700"
                    >
                        Reply
                    </button
                    >
                    </div>
                    )
                }
            </div>
            {comment.replies?.map((reply) => <CommentZone key={reply.id} handleSubmit={handleSubmit} members={members} comment={reply} isReply={true}/>)}
        </div>
    )
}