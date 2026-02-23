import { useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

type Message = { id: string; from: string; text: string; time: string; mine: boolean };
type Contact = { name: string; avatar: string; status: "online" | "away" | "offline"; lastMsg: string };

const contacts: Contact[] = [
  { name: "System Bot", avatar: "🤖", status: "online", lastMsg: "Welcome to BWOS Chat!" },
  { name: "Alice", avatar: "👩", status: "online", lastMsg: "Hey, how's it going?" },
  { name: "Bob", avatar: "👨", status: "away", lastMsg: "See you later!" },
  { name: "Dev Team", avatar: "👥", status: "online", lastMsg: "New build pushed." },
  { name: "Charlie", avatar: "🧑", status: "offline", lastMsg: "Thanks!" },
];

const botReplies = [
  "That's interesting! Tell me more.",
  "I'm just a local chat bot. No internet needed!",
  "Did you know BWOS has a built-in terminal?",
  "Try right-clicking the desktop for more options.",
  "Have you checked out the Settings app?",
  "Cool! What else are you working on?",
];

const ChatApp = () => {
  const theme = useStore((s) => s.theme);
  const username = useStore((s) => s.username);
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "System Bot": [
      { id: "1", from: "System Bot", text: "Welcome to BWOS Chat! This is a local messenger. Messages stay on your device.", time: "now", mine: false },
    ],
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dark = theme === "dark";

  const activeMessages = messages[activeContact.name] || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      from: username || "You",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mine: true,
    };
    setMessages((prev) => ({
      ...prev,
      [activeContact.name]: [...(prev[activeContact.name] || []), msg],
    }));
    setInput("");

    // Bot auto-reply after a short delay
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        from: activeContact.name,
        text: botReplies[Math.floor(Math.random() * botReplies.length)],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mine: false,
      };
      setMessages((prev) => ({
        ...prev,
        [activeContact.name]: [...(prev[activeContact.name] || []), reply],
      }));
    }, 800 + Math.random() * 1200);
  };

  const statusColor = (s: Contact["status"]) =>
    s === "online" ? "bg-green-400" : s === "away" ? "bg-yellow-400" : "bg-gray-400";

  return (
    <div className="flex h-full">
      {/* Contacts */}
      <div className={`w-56 flex-shrink-0 border-r overflow-auto ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        <div className={`px-3 py-2 text-xs font-semibold uppercase ${dark ? "text-white/40" : "text-gray-400"}`}>Contacts</div>
        {contacts.map((c) => (
          <button
            key={c.name}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
              activeContact.name === c.name
                ? dark ? "bg-white/10" : "bg-blue-50"
                : dark ? "hover:bg-white/5" : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveContact(c)}
          >
            <div className="relative">
              <span className="text-xl">{c.avatar}</span>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-slate-800" : "border-gray-50"} ${statusColor(c.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{c.name}</div>
              <div className={`text-xs truncate ${dark ? "text-white/40" : "text-gray-400"}`}>{c.lastMsg}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${dark ? "border-white/10" : "border-gray-200"}`}>
          <span className="text-lg">{activeContact.avatar}</span>
          <div>
            <div className="text-sm font-medium">{activeContact.name}</div>
            <div className={`text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>{activeContact.status}</div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
          {activeMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                  msg.mine
                    ? "bg-blue-500 text-white rounded-br-md"
                    : dark
                    ? "bg-white/10 rounded-bl-md"
                    : "bg-gray-100 rounded-bl-md"
                }`}
              >
                <div>{msg.text}</div>
                <div className={`text-[10px] mt-1 ${msg.mine ? "text-white/60" : dark ? "text-white/30" : "text-gray-400"}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className={`px-3 py-2 border-t flex gap-2 ${dark ? "border-white/10" : "border-gray-200"}`}>
          <input
            className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none ${dark ? "bg-white/10 focus:bg-white/15" : "bg-gray-100 focus:bg-gray-200"}`}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
