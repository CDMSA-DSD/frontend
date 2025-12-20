import { authFetch } from "@/lib/fetcher";

export type ChatbotRequest = { message: string };
export type ChatbotResponse = { response: string };

export class ChatbotError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatbotError";
    this.status = status;
  }
}

function friendlyMessage(status: number | undefined, fallback: string) {
  if (status === 401 || status === 403) {
    return "Your session expired. Please log in again.";
  }
  if (status === 429) {
    return "Too many requests. Please try again in a moment.";
  }
  if (typeof status === "number" && status >= 500) {
    return "Chatbot is temporarily unavailable. Please try again.";
  }
  return fallback || "Request failed.";
}

export async function sendChatbotMessage(message: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) {
    throw new ChatbotError(
      "Missing NEXT_PUBLIC_BACKEND_URL environment variable.",
    );
  }

  const res = await authFetch(`${base}/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message } satisfies ChatbotRequest),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const fallback = text ? `Request failed (${res.status}): ${text}` : `Request failed (${res.status}).`;
    throw new ChatbotError(friendlyMessage(res.status, fallback), res.status);
  }

  const json = (await res.json()) as Partial<ChatbotResponse>;
  const reply = typeof json?.response === "string" ? json.response : "";
  if (!reply) {
    throw new ChatbotError("Unexpected chatbot response format.");
  }

  return reply;
}
