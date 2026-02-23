import { useMemo, useState } from "react";
import { useStore } from "../../os/state/store";
import type { FsNode } from "../../os/fs/fsTypes";
import { findChildByName } from "../../os/fs/fsOps";

type Props = { windowId: string };
type ViewMode = "grid" | "list";

const ExplorerApp = ({ windowId }: Props) => {
  const fs = useStore((s) => s.fs);
  const fsList = useStore((s) => s.fsList);
  const fsMkdir = useStore((s) => s.fsMkdir);
  const fsTouch = useStore((s) => s.fsTouch);
  const fsRename = useStore((s) => s.fsRename);
  const fsDelete = useStore((s) => s.fsDelete);
  const openFile = useStore((s) => s.openFile);
  const clipboardCopy = useStore((s) => s.clipboardCopy);
  const clipboardCut = useStore((s) => s.clipboardCut);
  const clipboardPaste = useStore((s) => s.clipboardPaste);
  const fsCopy = useStore((s) => s.fsCopy);
  const fsMove = useStore((s) => s.fsMove);

  const rootId = fs.rootId;
  const desktopId = findChildByName(fs, rootId, "Desktop")?.id ?? rootId;

  const win = useStore((s) => s.windows.find((w) => w.id === windowId));
  const payloadFolderId = win?.payload?.folderId as string | undefined;
  const [currentId, setCurrentId] = useState<string>(payloadFolderId ?? desktopId);
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [context, setContext] = useState<{ x: number; y: number; targetId?: string } | null>(null);

  const items = useMemo(() => fsList(currentId), [currentId, fs, fsList]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  // Build breadcrumb path
  const breadcrumbs = useMemo(() => {
    const parts: { id: string; name: string }[] = [];
    let node = fs.nodes[currentId];
    while (node) {
      parts.unshift({ id: node.id, name: node.parentId ? node.name : "This PC" });
      if (!node.parentId) break;
      node = fs.nodes[node.parentId];
    }
    return parts;
  }, [currentId, fs.nodes]);

  const navigateTo = (id: string) => {
    setNavHistory((prev) => [...prev, currentId]);
    setCurrentId(id);
    setSelectedIds(new Set());
    setSearchQuery("");
  };

  const handleOpen = (node: FsNode) => {
    if (node.type === "folder") {
      navigateTo(node.id);
      return;
    }
    openFile(node.id);
  };

  const handleBack = () => {
    setNavHistory((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) { setCurrentId(last); setSelectedIds(new Set()); }
      return next;
    });
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else if (e.shiftKey && selectedIds.size > 0) {
      const allIds = filteredItems.map((i) => i.id);
      const lastSelected = [...selectedIds].pop()!;
      const startIdx = allIds.indexOf(lastSelected);
      const endIdx = allIds.indexOf(id);
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      setSelectedIds(new Set(allIds.slice(from, to + 1)));
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const handleCopy = () => {
    if (selectedIds.size > 0) {
      clipboardCopy("files", { fileIds: [...selectedIds] }, "explorer");
    }
  };

  const handleCut = () => {
    if (selectedIds.size > 0) {
      clipboardCut("files", { fileIds: [...selectedIds] }, "explorer");
    }
  };

  const handlePaste = () => {
    const clip = clipboardPaste();
    if (!clip || clip.type !== "files" || !clip.fileIds) return;
    for (const id of clip.fileIds) {
      if (clip.cut) {
        fsMove(id, currentId);
      } else {
        fsCopy(id, currentId);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "F2" && selectedIds.size === 1) {
      setRenamingId([...selectedIds][0]);
    }
    if (e.key === "Delete" && selectedIds.size > 0) {
      selectedIds.forEach((id) => fsDelete(id));
      setSelectedIds(new Set());
    }
    if (e.key === "Enter" && selectedIds.size === 1) {
      const node = fs.nodes[[...selectedIds][0]];
      if (node) handleOpen(node);
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") { e.preventDefault(); handleCopy(); }
    if (e.ctrlKey && e.key.toLowerCase() === "x") { e.preventDefault(); handleCut(); }
    if (e.ctrlKey && e.key.toLowerCase() === "v") { e.preventDefault(); handlePaste(); }
    if (e.ctrlKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const sidebarFolders = ["Desktop", "Documents", "Downloads", "Pictures"];

  return (
    <div className="flex h-full bg-slate-950/40 text-sm">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 p-3 space-y-1 flex-shrink-0">
        <div className="font-medium text-white/80 mb-2 text-xs uppercase tracking-wide">Quick access</div>
        <button
          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 ${currentId === rootId ? "bg-white/10" : ""}`}
          onClick={() => navigateTo(rootId)}
        >
          🖥️ This PC
        </button>
        {sidebarFolders.map((name) => {
          const node = findChildByName(fs, rootId, name);
          return (
            <button
              key={name}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 ${node?.id === currentId ? "bg-white/10" : ""}`}
              onClick={() => node && navigateTo(node.id)}
            >
              {name === "Desktop" ? "🖥️" : name === "Documents" ? "📄" : name === "Downloads" ? "⬇️" : "🖼️"} {name}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <button className="h-7 w-7 rounded-lg hover:bg-white/10 disabled:opacity-30" onClick={handleBack} disabled={navHistory.length === 0} title="Back">
            ←
          </button>

          {/* Breadcrumbs */}
          <div className="flex-1 flex items-center bg-white/5 rounded-lg px-2 py-1 text-xs text-white/70 gap-1 overflow-hidden">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && <span className="text-white/30">›</span>}
                <button className="hover:text-white hover:underline truncate max-w-[120px]" onClick={() => navigateTo(crumb.id)}>
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          {/* Search */}
          <input
            className="bg-white/5 rounded-lg px-2 py-1 text-xs outline-none w-32 focus:w-48 transition-all placeholder-white/30"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            title="Search files"
          />

          {/* View toggle */}
          <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
            <button
              className={`px-2 py-1 text-xs ${viewMode === "grid" ? "bg-white/15" : "hover:bg-white/10"}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`px-2 py-1 text-xs ${viewMode === "list" ? "bg-white/15" : "hover:bg-white/10"}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              ≡
            </button>
          </div>

          {/* Actions */}
          <button className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs" onClick={() => fsMkdir(currentId, "New Folder")}>
            + Folder
          </button>
          <button className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs" onClick={() => fsTouch(currentId, "New File.txt", "")}>
            + File
          </button>
        </div>

        {/* File area */}
        <div
          className="flex-1 p-3 overflow-auto focus:outline-none"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
            setContext({ x: e.clientX, y: e.clientY });
          }}
          onClick={() => {
            setContext(null);
            setSelectedIds(new Set());
          }}
        >
          {filteredItems.length === 0 ? (
            <div className="text-white/30 text-xs text-center mt-8">
              {searchQuery ? "No matching files" : "This folder is empty"}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,120px)] gap-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`p-2 rounded-lg text-left hover:bg-white/10 ${selectedIds.has(item.id) ? "bg-white/15 ring-1 ring-white/20" : ""}`}
                  onClick={(e) => { e.stopPropagation(); handleSelect(item.id, e); }}
                  onDoubleClick={() => handleOpen(item)}
                  onContextMenu={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setSelectedIds(new Set([item.id]));
                    setContext({ x: e.clientX, y: e.clientY, targetId: item.id });
                  }}
                >
                  <div className="text-2xl text-center">{item.type === "folder" ? "📁" : "📄"}</div>
                  {renamingId === item.id ? (
                    <input
                      className="mt-1 w-full bg-black/30 rounded px-1 text-xs text-center"
                      defaultValue={item.name}
                      autoFocus
                      title="Rename"
                      onBlur={(e) => { fsRename(item.id, e.target.value || item.name); setRenamingId(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { fsRename(item.id, (e.target as HTMLInputElement).value); setRenamingId(null); } }}
                    />
                  ) : (
                    <div className="mt-1 text-xs truncate text-center">{item.name}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="space-y-0.5">
              <div className="flex items-center text-[10px] text-white/30 px-2 py-1 border-b border-white/5 uppercase tracking-wide">
                <span className="flex-1">Name</span>
                <span className="w-20 text-right">Type</span>
                <span className="w-20 text-right">Size</span>
              </div>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left hover:bg-white/10 ${selectedIds.has(item.id) ? "bg-white/15 ring-1 ring-white/20" : ""}`}
                  onClick={(e) => { e.stopPropagation(); handleSelect(item.id, e); }}
                  onDoubleClick={() => handleOpen(item)}
                  onContextMenu={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setSelectedIds(new Set([item.id]));
                    setContext({ x: e.clientX, y: e.clientY, targetId: item.id });
                  }}
                >
                  <span className="text-sm mr-2">{item.type === "folder" ? "📁" : "📄"}</span>
                  {renamingId === item.id ? (
                    <input
                      className="flex-1 bg-black/30 rounded px-1 text-xs"
                      defaultValue={item.name}
                      autoFocus
                      title="Rename"
                      onBlur={(e) => { fsRename(item.id, e.target.value || item.name); setRenamingId(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { fsRename(item.id, (e.target as HTMLInputElement).value); setRenamingId(null); } }}
                    />
                  ) : (
                    <span className="flex-1 text-xs truncate">{item.name}</span>
                  )}
                  <span className="w-20 text-right text-[10px] text-white/40">{item.type === "folder" ? "Folder" : "File"}</span>
                  <span className="w-20 text-right text-[10px] text-white/40">
                    {item.type === "file" ? `${(item.content?.length ?? 0)}B` : `${item.children?.length ?? 0} items`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-white/10 text-[10px] text-white/30">
          <span>{filteredItems.length} items</span>
          <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : ""}</span>
        </div>
      </div>

      {/* Context menu */}
      {context && (
        <div className="fixed z-50 rounded-xl glass shadow-glass py-1.5 text-xs min-w-[160px]" style={{ left: context.x, top: context.y }}>
          {context.targetId ? (
            <>
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { const n = fs.nodes[context.targetId!]; if (n) handleOpen(n); setContext(null); }}>
                Open
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { handleCopy(); setContext(null); }}>
                Copy
              </button>
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { handleCut(); setContext(null); }}>
                Cut
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { setRenamingId(context.targetId!); setContext(null); }}>
                Rename
              </button>
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10 text-red-300" onClick={() => { fsDelete(context.targetId!); setContext(null); }}>
                Delete
              </button>
            </>
          ) : (
            <>
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { fsMkdir(currentId, "New Folder"); setContext(null); }}>
                New Folder
              </button>
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { fsTouch(currentId, "New File.txt", ""); setContext(null); }}>
                New File
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="px-3 py-1.5 w-full text-left hover:bg-white/10" onClick={() => { handlePaste(); setContext(null); }}>
                Paste
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorerApp;
