import { useEffect, useMemo, useState } from "react";
import { useStore, type DesktopItem } from "../state/store";
import { findChildByName } from "../fs/fsOps";

const DesktopIcons = () => {
  const items = useStore((s) => s.desktopItems);
  const fs = useStore((s) => s.fs);
  const fsList = useStore((s) => s.fsList);
  const openWindow = useStore((s) => s.openWindow);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent, item: DesktopItem) => {
    e.stopPropagation();
    setSelectedId(item.id);
  };

  const handleDoubleClick = (e: React.MouseEvent, item: DesktopItem) => {
    e.stopPropagation();
    if (item.appId) {
      openWindow(item.appId, item.payload);
    } else if (item.type === "file") {
      openWindow("notepad", { fileId: item.fsId, fileName: item.name });
    } else if (item.type === "folder") {
      openWindow("explorer", { folderId: item.fsId });
    }
  };

  const desktopFsItems: DesktopItem[] = useMemo(() => {
    try {
      const desktopFolder = findChildByName(fs, fs.rootId, "Desktop");
      if (!desktopFolder) return [];
      const nodes = fsList(desktopFolder.id);
      if (!nodes) return [];
      return nodes.map((node) => ({
        id: `fs-${node.id}`,
        name: node.name,
        type: node.type === "folder" ? "folder" : "file",
        fsId: node.id,
        icon: node.type === "folder" ? "📁" : "📄",
      }));
    } catch (e) {
      console.error("Error loading desktop FS items:", e);
      return [];
    }
  }, [fs, fsList]);

  const combinedItems = useMemo(() => {
    const all = [...items, ...desktopFsItems];
    return all;
  }, [items, desktopFsItems]);

  const gravityActive = useStore((s) => s.gravityActive);

  return (
    <div 
      className="p-6 grid grid-cols-[repeat(auto-fill,96px)] gap-4 h-full"
      onContextMenu={(e) => {
        // Allow right-click on empty space in the grid to bubble up to Desktop
      }}
    >
      {combinedItems.map((item, index) => (
        <button
          key={item.id}
          className={`desktop-icon flex flex-col items-center justify-center rounded-xl gap-2 text-sm text-white drop-shadow-md transition-all duration-700 ease-in-out ${
            selectedId === item.id
              ? "bg-white/20 ring-1 ring-white/40"
              : "hover:bg-white/10"
          }`}
          style={{
            transform: gravityActive 
              ? `translateY(${window.innerHeight - 200 - (Math.floor(index / 8) * 100)}px) rotate(${Math.random() * 20 - 10}deg)` 
              : 'translateY(0) rotate(0)',
          }}
          onClick={(event) => handleClick(event, item)}
          onDoubleClick={(event) => handleDoubleClick(event, item)}
        >
          <div className="text-2xl">{item.icon}</div>
          <div className="text-center leading-tight">{item.name}</div>
        </button>
      ))}
    </div>
  );
};

export default DesktopIcons;
