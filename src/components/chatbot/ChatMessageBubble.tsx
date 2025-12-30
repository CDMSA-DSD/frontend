import type { ChatMessage } from "@/components/chatbot/types";

type Props = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[80%] rounded-2xl rounded-br-md bg-cdmsa-primary px-4 py-2 text-sm text-white shadow-sm whitespace-pre-wrap break-words"
            : "max-w-[80%] rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm whitespace-pre-wrap break-words"
        }
      >
        {message.content}
      </div>
    </div>
  );
}
