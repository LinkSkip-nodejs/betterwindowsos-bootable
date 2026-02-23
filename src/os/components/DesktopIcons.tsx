import { memo, useMemo, useRef, useState } from "react";
import { useStore, type DesktopItem } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import { findChildByName } from "../fs/fsOps";
import { sounds } from "../utils/sounds";

const DesktopIcons = memo(() => {
  const items = useStore((s) => s.desktopItems);
  const openWindow = useStore((s) => s.openWindow);
  const openFile = useStore((s) => s.openFile);
  const muted = useStore((s) => s.muted);
  const fsDelete = useStore((s) => s.fsDelete);
  const fsRename = useStore((s) => s.fsRename);
  const clipboardCopy = useStore((s) => s.clipboardCopy);
  const clipboardPaste = useStore((s) => s.clipboardPaste);
  const fsCopy = useStore((s) => s.fsCopy);
  const fsMove = useStore((s) => s.fsMove);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent, item: DesktopItem) => {
    e.stopPropagation();
    setSelectedId(item.id);
  };

  const handleDoubleClick = (e: React.MouseEvent, item: DesktopItem) => {
    e.stopPropagation();
    if (!muted) sounds.windowOpen();
    if (item.appId) {
      openWindow(item.appId, item.payload);
    } else if (item.fsId) {
      openFile(item.fsId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: DesktopItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(item.id);

    const actions: { id: string; label: string; icon?: string; onClick: () => void }[] = [
      {
        id: "open",
        label: "Open",
        icon: "📂",
        onClick: () => {
          if (item.appId) openWindow(item.appId, item.payload);
          else if (item.fsId) openFile(item.fsId);
        },
      },
    ];

    if (item.fsId) {
      actions.push(
        { id: "sep1", label: "───", onClick: () => {} },
        {
          id: "copy",
          label: "Copy",
          icon: "📋",
          onClick: () => clipboardCopy("files", { fileIds: [item.fsId!] }, "desktop"),
        },
        { id: "sep2", label: "───", onClick: () => {} },
        {
          id: "rename",
          label: "Rename",
          icon: "✏️",
          onClick: () => {
            const newName = prompt("Rename to:", item.name);
            if (newName && newName !== item.name) fsRename(item.fsId!, newName);
          },
        },
        {
          id: "delete",
          label: "Delete",
          icon: "🗑️",
          onClick: () => {
            if (!muted) sounds.trash();
            fsDelete(item.fsId!);
          },
        },
      );
    }

    window.dispatchEvent(
      new CustomEvent("webos:contextmenu", {
        detail: {
          type: "icon",
          x: e.clientX,
          y: e.clientY,
          actions,
        },
      })
    );
  };

  // Only re-render when Desktop folder children actually change
  const desktopFsItems: DesktopItem[] = useStore(
    useShallow((s) => {
      try {
        const desktopFolder = findChildByName(s.fs, s.fs.rootId, "Desktop");
        if (!desktopFolder) return [];
        const children = Object.values(s.fs.nodes).filter(
          (n) => n.parentId === desktopFolder.id && !n.deleted
        );
        return children.map((node) => ({
          id: `fs-${node.id}`,
          name: node.name,
          type: (node.type === "folder" ? "folder" : "file") as "folder" | "file",
          fsId: node.id,
          icon: node.type === "folder" ? "📁" : "📄",
        }));
      } catch {
        return [];
      }
    })
  );

  const combinedItems = useMemo(() => {
    return [...items, ...desktopFsItems];
  }, [items, desktopFsItems]);

  const gravityActive = useStore((s) => s.gravityActive);

  // Pre-compute random rotations so they don't change on every render
  const gravityRotations = useRef<number[]>([]);
  if (gravityActive && gravityRotations.current.length < combinedItems.length) {
    gravityRotations.current = combinedItems.map(() => Math.random() * 20 - 10);
  }

  return (
    <div className="p-6 grid grid-cols-[repeat(auto-fill,96px)] gap-4 h-full">
      {combinedItems.map((item, index) => (
        <button
          key={item.id}
          className={`desktop-icon flex flex-col items-center justify-center rounded-xl gap-2 text-sm text-white drop-shadow-md ${
            selectedId === item.id
              ? "bg-white/20 ring-1 ring-white/40"
              : "hover:bg-white/10"
          }`}
          style={{
            transform: gravityActive
              ? `translateY(${window.innerHeight - 200 - (Math.floor(index / 8) * 100)}px) rotate(${gravityRotations.current[index] ?? 0}deg)`
              : undefined,
            transition: gravityActive ? "transform 0.7s ease-in-out" : undefined,
          }}
          onClick={(event) => handleClick(event, item)}
          onDoubleClick={(event) => handleDoubleClick(event, item)}
          onContextMenu={(event) => handleContextMenu(event, item)}
          aria-label={item.name}
        >
          <div className="text-2xl" aria-hidden="true">{item.icon}</div>
          <div className="text-center leading-tight text-xs">{item.name}</div>
        </button>
      ))}
    </div>
  );
});

DesktopIcons.displayName = "DesktopIcons";
export default DesktopIcons;
