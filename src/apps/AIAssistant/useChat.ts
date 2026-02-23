import { useCallback, useRef, useState } from "react";
import { sendChat, getSystemMessage, type ChatMessage, type ChatError } from "./openai";

export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

let msgCounter = 0;
const nextId = () => `msg-${Date.now()}-${++msgCounter}`;

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<ChatMessage[]>([getSystemMessage()]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);

    const userMsg: DisplayMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    historyRef.current.push({ role: "user", content: trimmed });

    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
    ]);

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let fullResponse = "";

    try {
      await sendChat(
        historyRef.current,
        (chunk) => {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullResponse } : m))
          );
        },
        controller.signal
      );

      historyRef.current.push({ role: "assistant", content: fullResponse });
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return;

      const chatErr = err as ChatError;
      const errMsg = chatErr.message ?? "Something went wrong.";
      setError(errMsg);

      // Remove the empty assistant placeholder on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      // Also remove the user message from API history so context stays clean
      historyRef.current.pop();
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [loading]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setLoading(false);
    historyRef.current = [getSystemMessage()];
  }, []);

  return { messages, loading, error, send, stop, clear };
}
