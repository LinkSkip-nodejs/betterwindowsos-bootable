import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useStore } from "../../os/state/store";
import type { FsNode } from "../../os/fs/fsTypes";
import { listFolder } from "../../os/fs/fsOps";

type Props = { windowId: string };

type Tab = {
  fileId: string;
  name: string;
  content: string;
  dirty: boolean;
  language: string;
};

const langFromName = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    py: "python",
    sh: "shell",
    txt: "plaintext",
  };
  return map[ext] ?? "plaintext";
};

/* ── File Tree ─────────────────────────────────────────────── */

const FileTreeNode = ({
  node,
  depth,
  fs,
  onOpen,
  expandedIds,
  toggleExpand,
}: {
  node: FsNode;
  depth: number;
  fs: import("../../os/fs/fsTypes").FsState;
  onOpen: (node: FsNode) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) => {
  const isFolder = node.type === "folder";
  const expanded = expandedIds.has(node.id);
  const children = isFolder ? listFolder(fs, node.id) : [];

  return (
    <div>
      <button
        className="w-full flex items-center gap-1 px-2 py-[3px] text-xs hover:bg-white/10 text-left truncate"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => (isFolder ? toggleExpand(node.id) : onOpen(node))}
        onDoubleClick={() => !isFolder && onOpen(node)}
      >
        <span className="opacity-60 text-[10px] w-3 text-center shrink-0">
          {isFolder ? (expanded ? "▾" : "▸") : " "}
        </span>
        <span className="shrink-0">{isFolder ? "📁" : "📄"}</span>
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && expanded && (
        <div>
          {children
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === "folder" ? -1 : 1;
            })
            .map((child) => (
              <FileTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                fs={fs}
                onOpen={onOpen}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  );
};

/* ── Command Palette ──────────────────────────────────────── */

type PaletteAction = { id: string; label: string; action: () => void };

const CommandPalette = ({
  actions,
  onClose,
}: {
  actions: PaletteAction[];
  onClose: () => void;
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(
    () =>
      actions.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase())
      ),
    [actions, query]
  );

  return (
    <div className="absolute inset-0 z-50 flex justify-center pt-8" onClick={onClose}>
      <div
        className="w-[420px] h-fit bg-[#1e1e2e] border border-white/20 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="w-full px-3 py-2 bg-transparent text-sm outline-none border-b border-white/10"
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && filtered.length > 0) {
              filtered[0].action();
              onClose();
            }
          }}
        />
        <div className="max-h-[240px] overflow-y-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10"
              onClick={() => {
                a.action();
                onClose();
              }}
            >
              {a.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-white/40">No results</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Mini Terminal ────────────────────────────────────────── */

const MiniTerminal = ({ cwdId }: { cwdId: string }) => {
  const [history, setHistory] = useState<string[]>([
    "Welcome to VS Code Terminal",
    'Type "help" for available commands.',
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fs = useStore((s) => s.fs);
  const fsList = useStore((s) => s.fsList);
  const fsMkdir = useStore((s) => s.fsMkdir);
  const fsTouch = useStore((s) => s.fsTouch);
  const fsResolvePath = useStore((s) => s.fsResolvePath);
  const [cwd, setCwd] = useState(cwdId);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const currentFolder = fs.nodes[cwd];

  const run = (cmd: string) => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(" ");

    const lines = [`$ ${cmd}`];

    switch (command) {
      case "help":
        lines.push("Commands: ls, cd, mkdir, touch, pwd, clear, echo");
        break;
      case "ls": {
        const items = fsList(cwd);
        if (items.length === 0) lines.push("(empty)");
        else items.forEach((n) => lines.push(`${n.type === "folder" ? "📁" : "📄"} ${n.name}`));
        break;
      }
      case "cd": {
        if (!arg || arg === "~") {
          const desktop = fsResolvePath("Desktop", fs.rootId);
          if (desktop) setCwd(desktop.id);
          break;
        }
        const target = fsResolvePath(arg, cwd);
        if (target && target.type === "folder") {
          setCwd(target.id);
          lines.push(`Changed to ${target.name}`);
        } else {
          lines.push(`cd: no such directory: ${arg}`);
        }
        break;
      }
      case "mkdir":
        if (arg) {
          fsMkdir(cwd, arg);
          lines.push(`Created folder: ${arg}`);
        } else lines.push("Usage: mkdir <name>");
        break;
      case "touch":
        if (arg) {
          fsTouch(cwd, arg);
          lines.push(`Created file: ${arg}`);
        } else lines.push("Usage: touch <name>");
        break;
      case "pwd":
        lines.push(currentFolder?.name ?? "/");
        break;
      case "clear":
        setHistory([]);
        setInput("");
        return;
      case "echo":
        lines.push(arg);
        break;
      default:
        if (command) lines.push(`Command not found: ${command}`);
    }

    setHistory((prev) => [...prev, ...lines]);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e] text-xs font-mono">
      <div className="flex items-center gap-2 px-3 py-1 border-b border-white/10 text-white/50">
        <span>TERMINAL</span>
        <span className="ml-auto text-[10px]">{currentFolder?.name ?? "/"}</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith("$") ? "text-green-400" : "text-white/80"}>
            {line}
          </div>
        ))}
      </div>
      <div className="flex items-center border-t border-white/10">
        <span className="px-2 text-green-400">$</span>
        <input
          className="flex-1 bg-transparent py-1 pr-2 outline-none text-white/90"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) run(input);
          }}
          placeholder="Type a command..."
        />
      </div>
    </div>
  );
};

/* ── Main VS Code App ─────────────────────────────────────── */

const VSCodeApp = ({ windowId }: Props) => {
  const win = useStore((s) => s.windows.find((w) => w.id === windowId));
  const fs = useStore((s) => s.fs);
  const fsWrite = useStore((s) => s.fsWrite);
  const updateWindow = useStore((s) => s.updateWindow);
  const theme = useStore((s) => s.theme);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(["root"]));
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Determine initial folder
  const rootId = win?.payload?.folderId as string | undefined ?? "root";

  // Open file from payload if provided
  useEffect(() => {
    const fileId = win?.payload?.fileId as string | undefined;
    if (fileId) {
      const node = fs.nodes[fileId];
      if (node?.type === "file") {
        openFileTab(node);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTab = tabs.find((t) => t.fileId === activeTabId) ?? null;

  const openFileTab = useCallback(
    (node: FsNode) => {
      if (node.type !== "file") return;
      setTabs((prev) => {
        const existing = prev.find((t) => t.fileId === node.id);
        if (existing) {
          setActiveTabId(node.id);
          return prev;
        }
        const newTab: Tab = {
          fileId: node.id,
          name: node.name,
          content: node.content ?? "",
          dirty: false,
          language: langFromName(node.name),
        };
        setActiveTabId(node.id);
        return [...prev, newTab];
      });
    },
    []
  );

  const closeTab = (fileId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.fileId !== fileId);
      if (activeTabId === fileId) {
        setActiveTabId(next.length > 0 ? next[next.length - 1].fileId : null);
      }
      return next;
    });
  };

  const updateTabContent = (fileId: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, content, dirty: true } : t))
    );
  };

  const saveTab = (fileId: string) => {
    const tab = tabs.find((t) => t.fileId === fileId);
    if (!tab) return;
    fsWrite(fileId, tab.content);
    setTabs((prev) => prev.map((t) => (t.fileId === fileId ? { ...t, dirty: false } : t)));
  };

  const saveAll = () => {
    tabs.forEach((t) => {
      if (t.dirty) {
        fsWrite(t.fileId, t.content);
      }
    });
    setTabs((prev) => prev.map((t) => ({ ...t, dirty: false })));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Update window title
  useEffect(() => {
    const title = activeTab ? `${activeTab.name} — VS Code` : "VS Code";
    updateWindow(windowId, { title });
  }, [activeTab, updateWindow, windowId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTabId) saveTab(activeTabId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setTerminalOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, tabs]);

  // Command palette actions
  const paletteActions: PaletteAction[] = useMemo(
    () => [
      { id: "save", label: "File: Save", action: () => activeTabId && saveTab(activeTabId) },
      { id: "saveAll", label: "File: Save All", action: saveAll },
      { id: "toggleSidebar", label: "View: Toggle Sidebar", action: () => setSidebarOpen((v) => !v) },
      { id: "toggleTerminal", label: "View: Toggle Terminal", action: () => setTerminalOpen((v) => !v) },
      { id: "closeTab", label: "File: Close Tab", action: () => activeTabId && closeTab(activeTabId) },
      {
        id: "closeAll",
        label: "File: Close All Tabs",
        action: () => {
          setTabs([]);
          setActiveTabId(null);
        },
      },
      {
        id: "newFile",
        label: "File: New Untitled File",
        action: () => {
          const id = `untitled-${Date.now()}`;
          const newTab: Tab = {
            fileId: id,
            name: "Untitled",
            content: "",
            dirty: false,
            language: "plaintext",
          };
          setTabs((prev) => [...prev, newTab]);
          setActiveTabId(id);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTabId]
  );

  const monacoTheme = theme === "dark" ? "vs-dark" : "light";
  const rootNode = fs.nodes[rootId];

  // Desktop node for terminal cwd
  const desktopNode = Object.values(fs.nodes).find(
    (n) => n.type === "folder" && n.name === "Desktop" && !n.deleted
  );
  const termCwd = desktopNode?.id ?? rootId;

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-white/90 text-sm select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center h-9 bg-[#181825] border-b border-white/10 px-2 gap-1 shrink-0">
        <button
          className="px-2 py-1 rounded text-xs hover:bg-white/10"
          onClick={() => setSidebarOpen((v) => !v)}
          title="Toggle Sidebar (Ctrl+B)"
        >
          ☰
        </button>
        <span className="text-xs text-white/50 px-2">File</span>
        <span className="text-xs text-white/50 px-2">Edit</span>
        <span className="text-xs text-white/50 px-2">View</span>
        <span className="text-xs text-white/50 px-2">Terminal</span>
        <div className="flex-1" />
        <button
          className="px-2 py-1 rounded text-xs hover:bg-white/10 text-white/50"
          onClick={() => setPaletteOpen(true)}
          title="Command Palette (Ctrl+Shift+P)"
        >
          Ctrl+Shift+P
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / File Explorer */}
        {sidebarOpen && (
          <div className="w-52 shrink-0 bg-[#181825] border-r border-white/10 flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
              Explorer
            </div>
            <div className="flex-1 overflow-y-auto">
              {rootNode && (
                <FileTreeNode
                  node={rootNode}
                  depth={0}
                  fs={fs}
                  onOpen={openFileTab}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              )}
            </div>
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex items-center bg-[#181825] border-b border-white/10 overflow-x-auto shrink-0">
              {tabs.map((tab) => (
                <div
                  key={tab.fileId}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-r border-white/5 shrink-0 ${
                    activeTabId === tab.fileId
                      ? "bg-[#1e1e2e] text-white"
                      : "text-white/50 hover:text-white/70"
                  }`}
                  onClick={() => setActiveTabId(tab.fileId)}
                >
                  <span>{tab.dirty ? "●" : ""}</span>
                  <span>{tab.name}</span>
                  <button
                    className="ml-1 opacity-50 hover:opacity-100 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.fileId);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor / Welcome */}
          <div className="flex-1 overflow-hidden">
            {activeTab ? (
              <Editor
                key={activeTab.fileId}
                theme={monacoTheme}
                language={activeTab.language}
                value={activeTab.content}
                onChange={(value) => updateTabContent(activeTab.fileId, value ?? "")}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.focus();
                }}
                options={{
                  fontSize: 13,
                  fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  padding: { top: 8 },
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  bracketPairColorization: { enabled: true },
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
                <div className="text-5xl">⟨⟩</div>
                <div className="text-lg font-light">VS Code</div>
                <div className="text-xs space-y-1 text-center">
                  <div>Ctrl+Shift+P — Command Palette</div>
                  <div>Ctrl+B — Toggle Sidebar</div>
                  <div>Ctrl+` — Toggle Terminal</div>
                  <div>Open a file from the explorer to begin</div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal panel */}
          {terminalOpen && (
            <div className="h-40 shrink-0 border-t border-white/10">
              <MiniTerminal cwdId={termCwd} />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 shrink-0 bg-[#007acc] flex items-center px-3 text-[11px] text-white/90 gap-4">
        <span>{activeTab ? activeTab.language : "Plain Text"}</span>
        <span className="ml-auto">{activeTab?.dirty ? "Modified" : "Saved"}</span>
        <span>UTF-8</span>
        <span>LF</span>
        <button
          className="hover:bg-white/20 px-1 rounded"
          onClick={() => setTerminalOpen((v) => !v)}
        >
          Terminal
        </button>
      </div>

      {/* Command palette overlay */}
      {paletteOpen && (
        <CommandPalette
          actions={paletteActions}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </div>
  );
};

export default VSCodeApp;
