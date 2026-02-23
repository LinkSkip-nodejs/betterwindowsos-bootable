import { useState } from "react";
import { useStore } from "../../os/state/store";

type Feed = { id: string; name: string; url: string; icon: string };
type Article = { id: string; feedId: string; title: string; summary: string; date: string; read: boolean; url: string };

const defaultFeeds: Feed[] = [
  { id: "tech", name: "Tech News", url: "https://feeds.example.com/tech", icon: "💻" },
  { id: "science", name: "Science Daily", url: "https://feeds.example.com/science", icon: "🔬" },
  { id: "world", name: "World News", url: "https://feeds.example.com/world", icon: "🌍" },
  { id: "dev", name: "Dev Blog", url: "https://feeds.example.com/dev", icon: "👨‍💻" },
];

const sampleArticles: Article[] = [
  { id: "1", feedId: "tech", title: "New Open-Source OS Project Takes the Internet by Storm", summary: "A new desktop operating system built entirely with web technologies has garnered attention from developers worldwide. BetterWindowsOS demonstrates that modern web frameworks can deliver native-quality desktop experiences.", date: "2 hours ago", read: false, url: "#" },
  { id: "2", feedId: "tech", title: "WebAssembly Performance Reaches New Heights", summary: "Latest benchmarks show WebAssembly modules running at 95% of native speed in modern browsers, opening doors for more complex applications to run in the browser.", date: "5 hours ago", read: false, url: "#" },
  { id: "3", feedId: "science", title: "Breakthrough in Quantum Computing Stability", summary: "Researchers achieve record-breaking qubit coherence times at room temperature, bringing practical quantum computing closer to reality.", date: "8 hours ago", read: true, url: "#" },
  { id: "4", feedId: "world", title: "Global Renewable Energy Adoption Accelerates", summary: "New report shows renewable energy now accounts for 45% of global electricity generation, up from 30% just three years ago.", date: "1 day ago", read: true, url: "#" },
  { id: "5", feedId: "dev", title: "React 20 Release Candidate Available", summary: "The React team has released the first RC for version 20, featuring built-in state machines, automatic code splitting, and a new concurrent rendering engine.", date: "1 day ago", read: false, url: "#" },
  { id: "6", feedId: "dev", title: "TypeScript 7.0 Introduces Pattern Matching", summary: "The long-awaited pattern matching syntax is now available in TypeScript 7.0, along with improved type inference and new utility types.", date: "2 days ago", read: true, url: "#" },
  { id: "7", feedId: "tech", title: "AI-Powered Code Editors Become Mainstream", summary: "Over 70% of professional developers now use AI-assisted coding tools daily, according to the latest Stack Overflow survey.", date: "2 days ago", read: true, url: "#" },
  { id: "8", feedId: "science", title: "Mars Sample Return Mission Gets Green Light", summary: "Space agencies confirm the joint mission to bring Martian soil samples back to Earth will launch in 2027.", date: "3 days ago", read: true, url: "#" },
];

const RSSReaderApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const [feeds] = useState<Feed[]>(defaultFeeds);
  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [activeFeed, setActiveFeed] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [showAddFeed, setShowAddFeed] = useState(false);

  const filteredArticles = activeFeed
    ? articles.filter((a) => a.feedId === activeFeed)
    : articles;

  const unreadCount = (feedId?: string) =>
    articles.filter((a) => !a.read && (!feedId || a.feedId === feedId)).length;

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    if (!article.read) {
      setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, read: true } : a)));
    }
  };

  const markAllRead = () => {
    setArticles((prev) =>
      prev.map((a) => (activeFeed ? (a.feedId === activeFeed ? { ...a, read: true } : a) : { ...a, read: true }))
    );
  };

  return (
    <div className="flex h-full">
      {/* Feed sidebar */}
      <div className={`w-48 flex-shrink-0 border-r flex flex-col ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        <div className={`px-3 py-2 text-xs font-semibold uppercase ${dark ? "text-white/40" : "text-gray-400"}`}>Feeds</div>
        <button
          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
            activeFeed === null
              ? dark ? "bg-white/10" : "bg-blue-50 text-blue-600"
              : dark ? "hover:bg-white/5" : "hover:bg-gray-100"
          }`}
          onClick={() => { setActiveFeed(null); setSelectedArticle(null); }}
        >
          <span>📰</span>
          <span>All Feeds</span>
          {unreadCount() > 0 && (
            <span className="ml-auto text-xs bg-blue-500 text-white rounded-full px-1.5">{unreadCount()}</span>
          )}
        </button>
        {feeds.map((feed) => (
          <button
            key={feed.id}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              activeFeed === feed.id
                ? dark ? "bg-white/10" : "bg-blue-50 text-blue-600"
                : dark ? "hover:bg-white/5" : "hover:bg-gray-100"
            }`}
            onClick={() => { setActiveFeed(feed.id); setSelectedArticle(null); }}
          >
            <span>{feed.icon}</span>
            <span className="truncate">{feed.name}</span>
            {unreadCount(feed.id) > 0 && (
              <span className="ml-auto text-xs bg-blue-500/80 text-white rounded-full px-1.5">{unreadCount(feed.id)}</span>
            )}
          </button>
        ))}
        <div className="mt-auto p-2">
          {showAddFeed ? (
            <div className="space-y-1">
              <input
                className={`w-full px-2 py-1 rounded text-xs outline-none ${dark ? "bg-white/10" : "bg-white border border-gray-200"}`}
                placeholder="Feed URL..."
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                autoFocus
              />
              <div className="flex gap-1">
                <button className="flex-1 px-2 py-1 rounded text-xs bg-blue-500/20 hover:bg-blue-500/30" onClick={() => { setShowAddFeed(false); setNewFeedUrl(""); }}>Add</button>
                <button className={`flex-1 px-2 py-1 rounded text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={() => setShowAddFeed(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className={`w-full px-2 py-1.5 rounded-lg text-xs ${dark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"} transition-colors`} onClick={() => setShowAddFeed(true)}>
              + Add Feed
            </button>
          )}
        </div>
      </div>

      {/* Article list */}
      <div className={`w-72 flex-shrink-0 border-r overflow-auto flex flex-col ${dark ? "border-white/10" : "border-gray-200"}`}>
        <div className={`flex items-center justify-between px-3 py-2 border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
          <span className={`text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>{filteredArticles.length} articles</span>
          <button className={`text-xs ${dark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`} onClick={markAllRead}>Mark all read</button>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredArticles.map((article) => (
            <button
              key={article.id}
              className={`w-full text-left px-3 py-3 border-b transition-colors ${
                selectedArticle?.id === article.id
                  ? dark ? "bg-white/10 border-white/10" : "bg-blue-50 border-gray-200"
                  : dark ? "hover:bg-white/5 border-white/5" : "hover:bg-gray-50 border-gray-100"
              }`}
              onClick={() => handleSelectArticle(article)}
            >
              <div className={`text-sm leading-snug ${!article.read ? "font-semibold" : ""}`}>
                {!article.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5 align-middle" />}
                {article.title}
              </div>
              <div className={`text-xs mt-1 line-clamp-2 ${dark ? "text-white/40" : "text-gray-400"}`}>{article.summary}</div>
              <div className={`text-[10px] mt-1 ${dark ? "text-white/30" : "text-gray-300"}`}>
                {feeds.find((f) => f.id === article.feedId)?.name} &middot; {article.date}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Article content */}
      <div className="flex-1 overflow-auto p-4">
        {selectedArticle ? (
          <div className="max-w-2xl">
            <h2 className="text-xl font-medium mb-2">{selectedArticle.title}</h2>
            <div className={`text-xs mb-4 ${dark ? "text-white/40" : "text-gray-400"}`}>
              {feeds.find((f) => f.id === selectedArticle.feedId)?.name} &middot; {selectedArticle.date}
            </div>
            <div className={`text-sm leading-relaxed ${dark ? "text-white/80" : "text-gray-700"}`}>
              {selectedArticle.summary}
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-center h-full text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>
            Select an article to read
          </div>
        )}
      </div>
    </div>
  );
};

export default RSSReaderApp;
