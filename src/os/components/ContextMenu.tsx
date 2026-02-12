import { useEffect, useState } from "react";
import { useStore } from "../state/store";

type ContextAction = {
  id: string;
  label: string;
  onClick: () => void;
};

type ContextDetail = {
  type: "desktop" | "taskbar";
  x: number;
  y: number;
  actions: ContextAction[];
};

const ContextMenu = () => {
  const [detail, setDetail] = useState<ContextDetail | null>(null);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const onContextMenu = (event: Event) => {
      const custom = event as CustomEvent<ContextDetail>;
      setDetail(custom.detail);
    };
    const onClose = () => setDetail(null);

    window.addEventListener("webos:contextmenu", onContextMenu);
    window.addEventListener("webos:close-context-menus", onClose);
    window.addEventListener("click", onClose);
    return () => {
      window.removeEventListener("webos:contextmenu", onContextMenu);
      window.removeEventListener("webos:close-context-menus", onClose);
      window.removeEventListener("click", onClose);
    };
  }, []);

  if (!detail) return null;

  return (
    <div
      className={`absolute z-50 context-menu rounded-xl shadow-glass py-2 text-sm ${
        theme === "dark" ? "glass" : "glass-light"
      }`}
      style={{ left: detail.x, top: detail.y }}
    >
      {detail.actions.map((action) => (
        <button
          key={action.id}
          className="w-full px-3 py-2 text-left hover:bg-white/10"
          onClick={() => {
            action.onClick();
            setDetail(null);
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
