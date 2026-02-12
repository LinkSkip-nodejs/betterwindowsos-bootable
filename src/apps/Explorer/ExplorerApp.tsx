import { useMemo, useState } from "react";
import { useStore } from "../../os/state/store";
import type { FsNode } from "../../os/fs/fsTypes";
import { findChildByName } from "../../os/fs/fsOps";

type Props = {
  windowId: string;
};

const ExplorerApp = ({ windowId }: Props) => {
  const fs = useStore((s) => s.fs);
  const fsList = useStore((s) => s.fsList);
  const fsMkdir = useStore((s) => s.fsMkdir);
  const fsRename = useStore((s) => s.fsRename);
  const fsDelete = useStore((s) => s.fsDelete);
  const openWindow = useStore((s) => s.openWindow);

  const rootId = fs.rootId;
  const desktopId =
    findChildByName(fs, rootId, "Desktop")?.id ?? rootId;

  const window = useStore((s) => s.windows.find((w) => w.id === windowId));
  const payloadFolderId = window?.payload?.folderId as string | undefined;
  const [currentId, setCurrentId] = useState<string>(
    payloadFolderId ?? desktopId
  );
  const [history, setHistory] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [context, setContext] = useState<{
    x: number;
    y: number;
    targetId?: string;
  } | null>(null);

  const items = useMemo(() => fsList(currentId), [currentId, fs, fsList]);
  const currentNode = fs.nodes[currentId];

  const handleOpen = (node: FsNode) => {
    if (node.type === "folder") {
      setHistory((prev) => [...prev, currentId]);
      setCurrentId(node.id);
      setSelectedId(null);
      return;
    }
    openWindow("notepad", { fileId: node.id, fileName: node.name });
  };

  const handleBack = () => {
    setHistory((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) setCurrentId(last);
      return next;
    });
  };

  const handleNewFolder = () => {
    fsMkdir(currentId, "New Folder");
  };

  return (
    <div className="flex h-full bg-slate-950/40 text-sm">
      <div className="w-52 border-r border-white/10 p-3 space-y-2">
        <div className="font-medium text-white/80 mb-2">Quick access</div>
        <button
          className={`w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 ${
            currentId === rootId ? "bg-white/10" : ""
          }`}
          onClick={() => setCurrentId(rootId)}
        >
          🖥️ This PC
        </button>
        {["Desktop", "Documents", "Downloads", "Pictures"].map((name) => {
          const node = findChildByName(fs, rootId, name);
          return (
            <button
              key={name}
              className={`w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 ${
                node?.id === currentId ? "bg-white/10" : ""
              }`}
              onClick={() => node && setCurrentId(node.id)}
            >
              {name}
            </button>
          );
        })}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <button
            className="h-7 w-7 rounded-lg hover:bg-white/10"
            onClick={handleBack}
            disabled={history.length === 0}
          >
            ←
          </button>
          <div className="flex-1 bg-white/10 rounded-lg px-3 py-1 text-xs text-white/70">
            {currentId === rootId ? "This PC" : (currentNode?.name ?? "Folder")}
          </div>
          <button
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
            onClick={handleNewFolder}
          >
            New Folder
          </button>
        </div>
        <div
          className="flex-1 p-3 overflow-auto"
          tabIndex={0}
          onContextMenu={(event) => {
            event.preventDefault();
            setContext({ x: event.clientX, y: event.clientY });
          }}
          onClick={() => {
            setContext(null);
            setSelectedId(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "F2" && selectedId) {
              setRenamingId(selectedId);
            }
          }}
        >
          <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                className={`p-2 rounded-lg text-left hover:bg-white/10 ${
                  selectedId === item.id ? "bg-white/10" : ""
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(item.id);
                }}
                onDoubleClick={() => handleOpen(item)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedId(item.id);
                  setContext({ x: event.clientX, y: event.clientY, targetId: item.id });
                }}
              >
                <div className="text-2xl">{item.type === "folder" ? "📁" : "📄"}</div>
                {renamingId === item.id ? (
                  <input
                    className="mt-1 w-full bg-black/30 rounded px-1 text-xs"
                    defaultValue={item.name}
                    autoFocus
                    onBlur={(event) => {
                      fsRename(item.id, event.target.value || item.name);
                      setRenamingId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        fsRename(item.id, (event.target as HTMLInputElement).value);
                        setRenamingId(null);
                      }
                    }}
                  />
                ) : (
                  <div className="mt-1 text-xs truncate">{item.name}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {context && (
        <div
          className="fixed z-50 rounded-xl glass shadow-glass py-2 text-xs"
          style={{ left: context.x, top: context.y }}
        >
          <button
            className="px-3 py-2 w-full text-left hover:bg-white/10"
            onClick={() => {
              handleNewFolder();
              setContext(null);
            }}
          >
            New Folder
          </button>
          {context.targetId && (
            <>
              <button
                className="px-3 py-2 w-full text-left hover:bg-white/10"
                onClick={() => {
                  setRenamingId(context.targetId!);
                  setContext(null);
                }}
              >
                Rename
              </button>
              <button
                className="px-3 py-2 w-full text-left hover:bg-white/10"
                onClick={() => {
                  fsDelete(context.targetId!);
                  setContext(null);
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorerApp;
