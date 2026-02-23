import { useState } from "react";
import { useStore } from "../../os/state/store";

type Email = {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  folder: "inbox" | "sent" | "drafts" | "trash";
};

const sampleEmails: Email[] = [
  { id: "1", from: "welcome@bwos.local", subject: "Welcome to BWOS Mail!", body: "Thanks for trying out BetterWindowsOS Mail. This is your local email client.\n\nYou can compose, read, and organize emails right from your desktop.\n\nEnjoy!", date: "Today", read: false, folder: "inbox" },
  { id: "2", from: "system@bwos.local", subject: "System Update Available", body: "A new system update is available for BetterWindowsOS.\n\nPlease check Settings for more details.", date: "Today", read: false, folder: "inbox" },
  { id: "3", from: "tips@bwos.local", subject: "Quick Tips for BWOS", body: "Here are some tips:\n\n1. Use keyboard shortcuts to navigate faster\n2. Try the Focus Mode for productivity\n3. Customize your desktop with widgets\n4. Check out the Terminal for power-user features", date: "Yesterday", read: true, folder: "inbox" },
];

const MailApp = () => {
  const theme = useStore((s) => s.theme);
  const [emails, setEmails] = useState<Email[]>(sampleEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<Email["folder"]>("inbox");
  const [composing, setComposing] = useState(false);
  const [compTo, setCompTo] = useState("");
  const [compSubject, setCompSubject] = useState("");
  const [compBody, setCompBody] = useState("");

  const dark = theme === "dark";
  const folders: { key: Email["folder"]; label: string; icon: string }[] = [
    { key: "inbox", label: "Inbox", icon: "📥" },
    { key: "sent", label: "Sent", icon: "📤" },
    { key: "drafts", label: "Drafts", icon: "📋" },
    { key: "trash", label: "Trash", icon: "🗑️" },
  ];

  const filteredEmails = emails.filter((e) => e.folder === activeFolder);
  const unreadCount = emails.filter((e) => e.folder === "inbox" && !e.read).length;

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setComposing(false);
    if (!email.read) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, read: true } : e)));
    }
  };

  const handleSend = () => {
    if (!compTo.trim() || !compSubject.trim()) return;
    const sent: Email = {
      id: Date.now().toString(),
      from: "me@bwos.local",
      subject: compSubject,
      body: compBody,
      date: "Now",
      read: true,
      folder: "sent",
    };
    setEmails((prev) => [sent, ...prev]);
    setComposing(false);
    setCompTo("");
    setCompSubject("");
    setCompBody("");
  };

  const handleDelete = (id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder: "trash" as const } : e)));
    if (selectedEmail?.id === id) setSelectedEmail(null);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={`w-48 flex-shrink-0 border-r flex flex-col ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        <button
          className="m-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-colors"
          onClick={() => { setComposing(true); setSelectedEmail(null); }}
        >
          + Compose
        </button>
        <div className="flex-1 overflow-auto">
          {folders.map((f) => (
            <button
              key={f.key}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                activeFolder === f.key
                  ? dark ? "bg-white/10" : "bg-blue-50 text-blue-600"
                  : dark ? "hover:bg-white/5" : "hover:bg-gray-100"
              }`}
              onClick={() => { setActiveFolder(f.key); setSelectedEmail(null); setComposing(false); }}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {f.key === "inbox" && unreadCount > 0 && (
                <span className="ml-auto text-xs bg-blue-500 text-white rounded-full px-1.5">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Email list */}
      <div className={`w-64 flex-shrink-0 border-r overflow-auto ${dark ? "border-white/10" : "border-gray-200"}`}>
        {filteredEmails.length === 0 ? (
          <div className={`p-4 text-sm ${dark ? "text-white/40" : "text-gray-400"}`}>No emails</div>
        ) : (
          filteredEmails.map((email) => (
            <button
              key={email.id}
              className={`w-full text-left px-3 py-3 border-b text-sm transition-colors ${
                selectedEmail?.id === email.id
                  ? dark ? "bg-white/10 border-white/10" : "bg-blue-50 border-gray-200"
                  : dark ? "hover:bg-white/5 border-white/5" : "hover:bg-gray-50 border-gray-100"
              }`}
              onClick={() => handleSelectEmail(email)}
            >
              <div className={`flex items-center gap-1 ${!email.read ? "font-semibold" : ""}`}>
                {!email.read && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />}
                <span className="truncate">{email.from}</span>
              </div>
              <div className="truncate mt-0.5">{email.subject}</div>
              <div className={`text-xs mt-0.5 ${dark ? "text-white/30" : "text-gray-400"}`}>{email.date}</div>
            </button>
          ))
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {composing ? (
          <div className="space-y-3 max-w-xl">
            <h3 className="text-lg font-medium">New Message</h3>
            <input
              className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${dark ? "bg-white/10 focus:bg-white/15" : "bg-gray-100 focus:bg-gray-200"}`}
              placeholder="To..."
              value={compTo}
              onChange={(e) => setCompTo(e.target.value)}
            />
            <input
              className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${dark ? "bg-white/10 focus:bg-white/15" : "bg-gray-100 focus:bg-gray-200"}`}
              placeholder="Subject"
              value={compSubject}
              onChange={(e) => setCompSubject(e.target.value)}
            />
            <textarea
              className={`w-full px-3 py-2 rounded-lg text-sm outline-none resize-none h-48 ${dark ? "bg-white/10 focus:bg-white/15" : "bg-gray-100 focus:bg-gray-200"}`}
              placeholder="Write your message..."
              value={compBody}
              onChange={(e) => setCompBody(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors" onClick={handleSend}>Send</button>
              <button className={`px-4 py-2 rounded-lg text-sm transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={() => setComposing(false)}>Cancel</button>
            </div>
          </div>
        ) : selectedEmail ? (
          <div className="max-w-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">{selectedEmail.subject}</h3>
                <p className={`text-sm ${dark ? "text-white/50" : "text-gray-500"}`}>From: {selectedEmail.from} &middot; {selectedEmail.date}</p>
              </div>
              <button
                className={`px-3 py-1 rounded-lg text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                onClick={() => handleDelete(selectedEmail.id)}
              >
                🗑️ Delete
              </button>
            </div>
            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${dark ? "text-white/80" : "text-gray-700"}`}>
              {selectedEmail.body}
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-center h-full text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>
            Select an email to read
          </div>
        )}
      </div>
    </div>
  );
};

export default MailApp;
