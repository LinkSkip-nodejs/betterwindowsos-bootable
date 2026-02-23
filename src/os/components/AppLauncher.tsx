import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../state/store";
import { appMeta, type AppId } from "../apps";

const allApps = Object.entries(appMeta) as [AppId, (typeof appMeta)[AppId]][];

const AppLauncher = () => {
  const launcherOpen = useStore((s) => s.launcherOpen);
  const setLauncherOpen = useStore((s) => s.setLauncherOpen);
  const openWindow = useStore((s) => s.openWindow);
  const theme = useStore((s) => s.theme);

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (launcherOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [launcherOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allApps;
    const q = query.toLowerCase();
    return allApps.filter(
      ([id, meta]) =>
        id.includes(q) || meta.title.toLowerCase().includes(q)
    );
  }, [query]);

  if (!launcherOpen) return null;

  const handleLaunch = (appId: AppId) => {
    openWindow(appId);
    setLauncherOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setLauncherOpen(false)}
    >
      <div
        className={`w-[480px] rounded-2xl shadow-glass p-4 animate-[fadeIn_0.15s_ease] ${
          theme === "dark" ? "glass" : "glass-light"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:ring-2 ring-white/20"
          placeholder="Search apps..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLauncherOpen(false);
            if (e.key === "Enter" && filtered.length > 0) {
              handleLaunch(filtered[0][0]);
            }
          }}
        />
        <div className="mt-3 max-h-[300px] overflow-auto space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center text-white/40 text-xs py-6">No matches</div>
          )}
          {filtered.map(([id, meta]) => (
            <button
              key={id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
              onClick={() => handleLaunch(id)}
            >
              <span className="text-lg">{meta.icon}</span>
              <span>{meta.title}</span>
              <span className="ml-auto text-xs text-white/30">{id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppLauncher;
