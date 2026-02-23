import { useEffect, useMemo, useRef, useState } from "react";
import { executeScript, type RunResult } from "./runtime";
import type { ConsoleLine } from "./osApi";
import {
  loadScripts,
  saveScript,
  deleteScript,
  defaultScripts,
  type SavedScript,
  type PreloadedScript,
} from "./storage";

const categoryIcons: Record<string, string> = {
  Basics: "📘",
  System: "🖥️",
  Files: "📂",
  Math: "🔢",
  Text: "📝",
  Games: "🎮",
  Utilities: "🔧",
  Automation: "⚡",
};

function ScriptsPanel({
  groupedDefaults,
  scripts,
  activeScriptId,
  onLoadDefault,
  onLoad,
  onDelete,
  onClose,
}: {
  groupedDefaults: [string, PreloadedScript[]][];
  scripts: SavedScript[];
  activeScriptId: string | null;
  onLoadDefault: (d: PreloadedScript) => void;
  onLoad: (s: SavedScript) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const toggle = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const q = search.toLowerCase().trim();

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900/95 border-l border-white/10 flex flex-col z-20">
      <div className="px-3 py-2 border-b border-white/10 text-xs font-medium flex items-center justify-between">
        <span>Scripts Library</span>
        <button className="text-white/40 hover:text-white/80" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="px-3 py-2 border-b border-white/5">
        <input
          className="w-full bg-white/5 rounded px-2 py-1 text-xs outline-none border border-white/5 focus:border-blue-500/40 placeholder-white/20"
          placeholder="Search scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {/* User scripts */}
        {scripts.length > 0 && (
          <>
            <div className="px-3 py-2 text-[10px] text-white/30 uppercase tracking-wide">
              Your Scripts
            </div>
            {scripts
              .filter((s) => !q || s.name.toLowerCase().includes(q))
              .map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1 px-3 py-1.5 hover:bg-white/5 transition-colors ${
                    activeScriptId === s.id ? "bg-white/5" : ""
                  }`}
                >
                  <button
                    className="flex-1 text-left text-xs truncate flex items-center gap-2"
                    onClick={() => onLoad(s)}
                  >
                    <span className="text-blue-400/60">📜</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                  <button
                    className="text-white/20 hover:text-red-400 text-xs px-1 transition-colors shrink-0"
                    onClick={() => onDelete(s.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </>
        )}

        {/* Preloaded by category */}
        {groupedDefaults.map(([category, items]) => {
          const filtered = q
            ? items.filter((d) => d.name.toLowerCase().includes(q) || category.toLowerCase().includes(q))
            : items;
          if (filtered.length === 0) return null;
          const isOpen = expanded[category] ?? false;
          const icon = categoryIcons[category] ?? "📁";

          return (
            <div key={category}>
              <button
                className="w-full text-left px-3 py-2 text-[10px] text-white/40 uppercase tracking-wide hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
                onClick={() => toggle(category)}
              >
                <span className="text-[11px]">{isOpen ? "▾" : "▸"}</span>
                <span>{icon}</span>
                <span>{category}</span>
                <span className="ml-auto text-white/20">{filtered.length}</span>
              </button>
              {isOpen &&
                filtered.map((d) => (
                  <button
                    key={d.name}
                    className="w-full text-left px-3 pl-8 py-1.5 hover:bg-white/5 text-xs transition-colors flex items-center gap-2"
                    onClick={() => onLoadDefault(d)}
                  >
                    <span className="text-yellow-400/60 text-[10px]">▹</span>
                    <span className="truncate">{d.name}</span>
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ScriptStudioApp = () => {
  const [code, setCode] = useState(defaultScripts[0].code);
  const [scriptName, setScriptName] = useState(defaultScripts[0].name);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [output, setOutput] = useState<ConsoleLine[]>([]);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [scripts, setScripts] = useState<SavedScript[]>(() => loadScripts());
  const [showScripts, setShowScripts] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleRun = () => {
    const result = executeScript(code);
    setOutput(result.output);
    setLastResult(result);
  };

  const handleClear = () => {
    setOutput([]);
    setLastResult(null);
  };

  const handleSave = () => {
    const name = scriptName.trim() || "Untitled Script";
    const saved = saveScript(name, code, activeScriptId ?? undefined);
    setActiveScriptId(saved.id);
    setScripts(loadScripts());
  };

  const handleLoad = (script: SavedScript) => {
    setCode(script.code);
    setScriptName(script.name);
    setActiveScriptId(script.id);
    setShowScripts(false);
  };

  const handleLoadDefault = (d: PreloadedScript) => {
    setCode(d.code);
    setScriptName(d.name);
    setActiveScriptId(null);
    setShowScripts(false);
  };

  const groupedDefaults = useMemo(() => {
    const map = new Map<string, PreloadedScript[]>();
    for (const s of defaultScripts) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries());
  }, []);

  const handleDelete = (id: string) => {
    deleteScript(id);
    setScripts(loadScripts());
    if (activeScriptId === id) {
      setActiveScriptId(null);
    }
  };

  const handleNew = () => {
    setCode("// New script\nos.print(\"Hello!\");");
    setScriptName("Untitled");
    setActiveScriptId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter to run
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
    // Tab inserts spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.slice(0, start) + "  " + code.slice(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const lineColor = (type: ConsoleLine["type"]) => {
    switch (type) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      case "info": return "text-blue-400";
      case "result": return "text-green-400";
      default: return "text-white/80";
    }
  };

  return (
    <div className="h-full flex flex-col text-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        <input
          className="bg-white/5 rounded-lg px-3 py-1.5 text-sm outline-none border border-white/5 focus:border-blue-500/40 w-48"
          value={scriptName}
          onChange={(e) => setScriptName(e.target.value)}
          placeholder="Script name"
        />

        <button
          className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs transition-colors"
          onClick={handleRun}
          title="Run (Ctrl+Enter)"
        >
          ▶ Run
        </button>
        <button
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs transition-colors"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
          onClick={handleNew}
        >
          New
        </button>

        <div className="flex-1" />

        <button
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            showScripts ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
          }`}
          onClick={() => setShowScripts(!showScripts)}
        >
          📂 Scripts
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Code editor */}
        <div className="flex-1 flex flex-col border-r border-white/10 min-w-0">
          <div className="px-3 py-1.5 border-b border-white/5 text-[10px] text-white/30 flex items-center justify-between">
            <span>EDITOR</span>
            <span className="font-mono">{code.split("\n").length} lines</span>
          </div>
          <div className="flex-1 relative min-h-0">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-white/[0.02] border-r border-white/5 overflow-hidden pointer-events-none z-10">
              <div className="py-3 px-1 text-right text-[10px] text-white/20 font-mono leading-[1.55rem]">
                {code.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              className="w-full h-full bg-transparent text-white/90 font-mono text-xs leading-[1.55rem] resize-none outline-none p-3 pl-12 overflow-auto"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        </div>

        {/* Console output */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-3 py-1.5 border-b border-white/5 text-[10px] text-white/30 flex items-center justify-between">
            <span>CONSOLE</span>
            {lastResult && (
              <span className={lastResult.error ? "text-red-400" : "text-green-400"}>
                {lastResult.error ? "Error" : "OK"} — {lastResult.duration.toFixed(1)}ms
              </span>
            )}
          </div>
          <div
            ref={outputRef}
            className="flex-1 overflow-auto p-3 font-mono text-xs space-y-0.5"
          >
            {output.length === 0 ? (
              <div className="text-white/20 italic">
                Press ▶ Run or Ctrl+Enter to execute your script.
                <div className="mt-2">
                  Available APIs: os.print(), os.warn(), os.error(), os.notify(),
                  os.files.list(), os.files.read(), os.processes.list(),
                  os.system.info(), console.log()
                </div>
              </div>
            ) : (
              output.map((line, i) => (
                <div key={i} className={`${lineColor(line.type)} flex gap-2`}>
                  <span className="text-white/15 select-none shrink-0 w-6 text-right">
                    {i + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scripts panel (overlay) */}
        {showScripts && (
          <ScriptsPanel
            groupedDefaults={groupedDefaults}
            scripts={scripts}
            activeScriptId={activeScriptId}
            onLoadDefault={handleLoadDefault}
            onLoad={handleLoad}
            onDelete={handleDelete}
            onClose={() => setShowScripts(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ScriptStudioApp;
