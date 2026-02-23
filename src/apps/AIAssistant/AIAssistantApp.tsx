const SOURCE_CODE = `// AIAssistant - openai.ts
const STORAGE_KEY = "bwos-ai-apikey";
const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export async function sendChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = getStoredApiKey();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${apiKey}\`,
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
  // ... SSE stream parsing
}`;

const AIAssistantApp = () => {
  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-medium">AI Assistant</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
            Deprecated
          </span>
        </div>
      </div>

      {/* Deprecation notice */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center gap-5 max-w-lg mx-auto">
          <span className="text-5xl">🤖</span>
          <h2 className="text-lg font-semibold text-white/90">AI Assistant is Deprecated</h2>
          <p className="text-sm text-white/50 text-center leading-relaxed">
            This feature no longer works and has been deprecated.
            The OpenAI integration has been discontinued.
          </p>

          <div className="w-full rounded-xl bg-white/[0.03] border border-white/10 p-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-white/30 uppercase tracking-wide font-medium">Source Code</span>
            </div>
            <pre className="bg-black/30 rounded-lg px-4 py-3 overflow-x-auto text-[11px] font-mono text-white/70 leading-relaxed max-h-64 overflow-y-auto">
              <code>{SOURCE_CODE}</code>
            </pre>
          </div>

          <div className="w-full rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 mt-1">
            <p className="text-sm text-blue-400 text-center">
              Have a fix? DM <span className="font-semibold text-blue-300">linky_dabest2</span> on Discord
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantApp;
