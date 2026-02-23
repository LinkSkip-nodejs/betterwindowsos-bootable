const STORAGE_KEY = "bwos-ai-apikey";
const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatError = {
  type: "auth" | "rate_limit" | "no_key" | "network" | "unknown";
  message: string;
};

const SYSTEM_PROMPT = `You are the built-in AI assistant for BetterWindowsOS, a web-based desktop operating system.
You run inside a windowed app alongside other apps like Files, Terminal, Browser, VS Code, Notepad, Settings, Snake, Bouncy Ball, System Monitor, Script Studio, and Recycle Bin.
You help users navigate the OS, answer questions, write code, and provide general assistance.
Keep responses concise and helpful. Use markdown formatting when appropriate. the os is running on an real iso `;

export const getSystemMessage = (): ChatMessage => ({
  role: "system",
  content: SYSTEM_PROMPT,
});

export async function sendChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw { type: "no_key", message: "No API key set. Click the ⚙️ button to enter your OpenAI API key." } as ChatError;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 800,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401) {
      throw { type: "auth", message: "Invalid API key. Check your key in settings (⚙️)." } as ChatError;
    }
    if (res.status === 429) {
      throw { type: "rate_limit", message: "Rate limited by OpenAI. Wait a moment and try again." } as ChatError;
    }
    throw {
      type: "unknown",
      message: `API error ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    } as ChatError;
  }

  const reader = res.body?.getReader();
  if (!reader) throw { type: "network", message: "No response body" } as ChatError;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onChunk(delta);
      } catch {
        // skip malformed chunks
      }
    }
  }
}
