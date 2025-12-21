import React, {useEffect, useState} from "react";
import { Comment } from "@/lib/types";
import {Mention, MentionsInput} from "react-mentions";

interface CommentZoneProps {
    comment: Comment;
    handleSubmit: (comment:string, mentions:number[], parentId: number | null) => void;
    members: {id:number, firstname:string, lastName:string}[]
    isReply?: boolean;
}

function renderCommentText(text: string) {
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        const [full, display, id] = match;

        // Checking that we are not parsing twice same text!
        // If we have match.index / lastIndex, it means that there is content before mention
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        parts.push(
            <span
                key={match.index}
                className="bg-[#DFDDFF] font-semibold cursor-pointer"
            >
                @{display}
            </span>
        );

        lastIndex = mentionRegex.lastIndex;
    }

    // Check if after every mention pasted there is still content
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}


export default function CommentZone({comment, handleSubmit, members ,isReply = false} : CommentZoneProps): React.JSX.Element{
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [replyText, setReplyText] = useState<string>("");
    const [mentions, setMentions] = useState<number[]>([]);

    useEffect(() => {
        const regex = /@\[(.*?)\]\((.*?)\)/g;
        const matches = [...replyText.matchAll(regex)];
        const newMentions = matches.map(match => Number(match[2]));// ID de la mention;
        (() => setMentions(newMentions))();
    }, [replyText]);


    return (
        <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6 mt-4'}`}>
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 mb-3">{renderCommentText(comment.content)}</p>
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