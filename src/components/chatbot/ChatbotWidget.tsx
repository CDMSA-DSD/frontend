"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { MessageCircle, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessageBubble } from "@/components/chatbot/ChatMessageBubble";
import type { ChatMessage } from "@/components/chatbot/types";
import { ChatbotError, sendChatbotMessage } from "@/lib/api/chatbot";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toUiError(err: unknown) {
  if (err instanceof ChatbotError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setUiError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await sendChatbotMessage(text);
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setUiError(toUiError(e));
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }


  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-cdmsa-primary px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-cdmsa-primary-hover focus:outline-none focus:ring-2 focus:ring-cdmsa-border focus:ring-offset-2"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-5 w-5" />
          Chat
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <Dialog.Title className="text-sm font-semibold text-gray-900">
              Chatbot
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cdmsa-border"
                aria-label="Close chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex h-[60vh] max-h-[560px] flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Send a message to start the conversation.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <ChatMessageBubble key={m.id} message={m} />
                  ))}
                </div>
              )}

              {loading && (
                <div className="mt-3 flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
                    Thinking…
                  </div>
                </div>
              )}

              {uiError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {uiError}
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cdmsa-border focus:border-cdmsa-border"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="rounded-xl bg-cdmsa-secondary px-4 py-2 text-sm font-medium text-cdmsa-text-primary shadow-sm hover:bg-cdmsa-sidebar disabled:cursor-not-allowed"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
