import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

const HOME_URL = "https://www.google.com";
const isElectron = !!(window as any).electronAPI?.isElectron;

const ensureProtocol = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return HOME_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
};

type Tab = { id: number; url: string; title: string; loading: boolean };

let tabCounter = 1;

const BrowserApp = ({ windowId }: { windowId: string }) => {
  const theme = useStore((s) => s.theme);
  const googleAccount = useStore((s) => s.googleAccount);

  // Tabs
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 0, url: HOME_URL, title: "Google", loading: true },
  ]);
  const [activeTabId, setActiveTabId] = useState(0);
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Bookmarks & history
  const [bookmarks, setBookmarks] = useState<{ url: string; title: string }[]>([
    { url: "https://www.google.com", title: "Google" },
    { url: "https://www.wikipedia.org", title: "Wikipedia" },
    { url: "https://github.com", title: "GitHub" },
  ]);
  const [history, setHistory] = useState<{ url: string; title: string; time: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [inputValue, setInputValue] = useState(HOME_URL);
  const webviewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updateTab = useCallback((id: number, data: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const navigate = useCallback((target: string, tabId?: number) => {
    const resolved = ensureProtocol(target);
    const tid = tabId ?? activeTabId;
    updateTab(tid, { url: resolved, loading: true, title: resolved });
    setInputValue(resolved);
    setHistory((prev) => [{ url: resolved, title: resolved, time: Date.now() }, ...prev].slice(0, 100));
    if (isElectron && webviewRef.current) {
      webviewRef.current.loadURL(resolved);
    }
  }, [activeTabId, updateTab]);

  // Sync input value when switching tabs
  useEffect(() => {
    setInputValue(activeTab?.url ?? HOME_URL);
  }, [activeTabId, activeTab?.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(inputValue);
  };

  const addTab = () => {
    const newId = tabCounter++;
    setTabs((prev) => [...prev, { id: newId, url: HOME_URL, title: "New Tab", loading: true }]);
    setActiveTabId(newId);
    setInputValue(HOME_URL);
  };

  const closeTab = (id: number) => {
    if (tabs.length <= 1) return;
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id) setActiveTabId(next[next.length - 1].id);
      return next;
    });
  };

  const toggleBookmark = () => {
    const url = activeTab.url;
    const existing = bookmarks.findIndex((b) => b.url === url);
    if (existing >= 0) {
      setBookmarks((prev) => prev.filter((_, i) => i !== existing));
    } else {
      setBookmarks((prev) => [...prev, { url, title: activeTab.title }]);
    }
  };

  const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);

  // Webview events for Electron
  useEffect(() => {
    if (!isElectron) return;
    const wv = webviewRef.current;
    if (!wv) return;
    const onStartLoad = () => updateTab(activeTabId, { loading: true });
    const onStopLoad = () => {
      const currentUrl = wv.getURL();
      const title = wv.getTitle?.() ?? currentUrl;
      updateTab(activeTabId, { loading: false, url: currentUrl, title });
      setInputValue(currentUrl);
    };
    wv.addEventListener("did-start-loading", onStartLoad);
    wv.addEventListener("did-stop-loading", onStopLoad);
    return () => {
      wv.removeEventListener("did-start-loading", onStartLoad);
      wv.removeEventListener("did-stop-loading", onStopLoad);
    };
  }, [activeTabId, updateTab]);

  const handleBack = () => {
    if (isElectron && webviewRef.current) webviewRef.current.goBack();
    else { try { iframeRef.current?.contentWindow?.history.back(); } catch {} }
  };
  const handleForward = () => {
    if (isElectron && webviewRef.current) webviewRef.current.goForward();
    else { try { iframeRef.current?.contentWindow?.history.forward(); } catch {} }
  };
  const handleRefresh = () => {
    if (isElectron && webviewRef.current) webviewRef.current.reload();
    else if (iframeRef.current) iframeRef.current.src = activeTab.url;
    updateTab(activeTabId, { loading: true });
  };

  const btnClass = `h-7 w-7 rounded-lg text-sm flex items-center justify-center ${
    theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"
  }`;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className={`flex items-center gap-0.5 px-2 pt-1 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer max-w-[180px] min-w-[80px] group ${
              tab.id === activeTabId
                ? theme === "dark" ? "bg-slate-800" : "bg-white"
                : theme === "dark" ? "bg-white/5 hover:bg-white/10" : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.loading && <span className="animate-spin text-[10px]">⟳</span>}
            <span className="truncate flex-1">{tab.title || "New Tab"}</span>
            {tabs.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded w-4 h-4 flex items-center justify-center text-[10px]"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                title="Close tab"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className={`${btnClass} text-xs ml-1`} onClick={addTab} title="New tab">+</button>
      </div>

      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${
        theme === "dark" ? "bg-slate-800 border-white/10" : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center gap-0.5">
          <button className={btnClass} onClick={handleBack} title="Back">←</button>
          <button className={btnClass} onClick={handleForward} title="Forward">→</button>
          <button className={btnClass} onClick={handleRefresh} title="Refresh">↻</button>
          <button className={btnClass} onClick={() => navigate(HOME_URL)} title="Home">🏠</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`flex-1 h-7 px-3 rounded-lg text-xs outline-none ${
              theme === "dark"
                ? "bg-white/10 text-white placeholder-white/40 focus:bg-white/15"
                : "bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-blue-400"
            }`}
            placeholder="Search or enter URL..."
          />
        </form>

        <button className={btnClass} onClick={toggleBookmark} title={isBookmarked ? "Remove bookmark" : "Add bookmark"}>
          {isBookmarked ? "★" : "☆"}
        </button>
        <button className={btnClass} onClick={() => setShowHistory(!showHistory)} title="History">
          🕐
        </button>

        {googleAccount ? (
          <img src={googleAccount.picture} alt="" className="w-6 h-6 rounded-full border border-white/10" referrerPolicy="no-referrer"
            title={`${googleAccount.name}\n${googleAccount.email}`} />
        ) : (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
            theme === "dark" ? "bg-white/10 text-white/40" : "bg-gray-200 text-gray-400"
          }`} title="No account">👤</div>
        )}
      </div>

      {/* Bookmarks bar */}
      {bookmarks.length > 0 && (
        <div className={`flex items-center gap-1 px-3 py-1 border-b overflow-hidden ${
          theme === "dark" ? "border-white/5 bg-white/[0.02]" : "border-gray-100 bg-gray-50"
        }`}>
          {bookmarks.map((bm, i) => (
            <button
              key={i}
              className={`px-2 py-0.5 rounded text-[10px] truncate max-w-[120px] ${
                theme === "dark" ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-200 text-gray-600"
              }`}
              onClick={() => navigate(bm.url)}
              title={bm.url}
            >
              {bm.title}
            </button>
          ))}
        </div>
      )}

      {/* Loading bar */}
      {activeTab.loading && (
        <div className="h-0.5 bg-white/10 overflow-hidden">
          <div className="h-full" style={{
            width: "40%",
            background: "var(--accent-color, #4f9cf7)",
            animation: "loading-bar 1.5s ease-in-out infinite",
          }} />
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 relative">
        {isElectron ? (
          <webview ref={webviewRef} src={activeTab.url}
            style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} />
        ) : (
          <iframe ref={iframeRef} src={activeTab.url}
            className="w-full h-full border-none bg-white"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onLoad={() => {
              updateTab(activeTabId, { loading: false });
              // Try to get title from iframe
              try {
                const doc = iframeRef.current?.contentDocument;
                if (doc?.title) updateTab(activeTabId, { title: doc.title });
              } catch { /* cross-origin */ }
            }}
            title="Browser" />
        )}

        {/* History panel */}
        {showHistory && (
          <div className="absolute top-0 right-0 w-72 h-full glass border-l border-white/10 overflow-auto z-10">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-xs font-medium">History</span>
              <button className="text-xs hover:bg-white/10 px-2 py-1 rounded" onClick={() => setShowHistory(false)}>X</button>
            </div>
            <div className="p-2 space-y-0.5">
              {history.length === 0 ? (
                <div className="text-xs text-white/30 text-center py-4">No history yet</div>
              ) : (
                history.map((h, i) => (
                  <button key={i} className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-xs truncate"
                    onClick={() => { navigate(h.url); setShowHistory(false); }} title={h.url}>
                    {h.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserApp;
