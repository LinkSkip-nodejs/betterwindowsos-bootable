import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import { sounds } from "../utils/sounds";

type ContextAction = {
  id: string;
  label: string;
  onClick: () => void;
  icon?: string;
  separator?: boolean;
};

type ContextDetail = {
  type: "desktop" | "taskbar" | "titlebar" | "icon";
  x: number;
  y: number;
  actions: ContextAction[];
};

const ContextMenu = () => {
  const [detail, setDetail] = useState<ContextDetail | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const theme = useStore((s) => s.theme);
  const muted = useStore((s) => s.muted);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setDetail(null), []);

  useEffect(() => {
    const onContextMenu = (event: Event) => {
      const custom = event as CustomEvent<ContextDetail>;
      setDetail(custom.detail);
      setFocusIndex(0);
    };

    window.addEventListener("webos:contextmenu", onContextMenu);
    window.addEventListener("webos:close-context-menus", close);
    window.addEventListener("click", close);
    return () => {
      window.removeEventListener("webos:contextmenu", onContextMenu);
      window.removeEventListener("webos:close-context-menus", close);
      window.removeEventListener("click", close);
    };
  }, [close]);

  // Keyboard navigation
  useEffect(() => {
    if (!detail) return;

    const actionable = detail.actions.filter(
      (a) => !a.label.startsWith("───")
    );

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((i) => (i + 1) % actionable.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((i) => (i - 1 + actionable.length) % actionable.length);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (actionable[focusIndex]) {
            if (!muted) sounds.click();
            actionable[focusIndex].onClick();
            close();
          }
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detail, focusIndex, close, muted]);

  // Focus menu on open
  useEffect(() => {
    if (detail && menuRef.current) {
      menuRef.current.focus();
    }
  }, [detail]);

  if (!detail) return null;

  // Clamp position to viewport
  const x = Math.min(detail.x, window.innerWidth - 200);
  const y = Math.min(detail.y, window.innerHeight - detail.actions.length * 36 - 16);

  let actionIndex = -1;

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 context-menu rounded-xl py-1.5 text-sm ${
        theme === "dark" ? "glass" : "glass-light"
      }`}
      style={{ left: x, top: y }}
      role="menu"
      tabIndex={-1}
    >
      {detail.actions.map((action) => {
        // Separator
        if (action.label.startsWith("───")) {
          return (
            <div
              key={action.id}
              className="my-1 border-t border-white/10"
              role="separator"
            />
          );
        }

        actionIndex++;
        const isFocused = actionIndex === focusIndex;

        return (
          <button
            key={action.id}
            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
              isFocused
                ? "bg-white/15"
                : "hover:bg-white/10"
            }`}
            role="menuitem"
            onClick={() => {
              if (!muted) sounds.click();
              action.onClick();
              close();
            }}
            onMouseEnter={() => setFocusIndex(actionIndex)}
          >
            {action.icon && (
              <span className="w-5 text-center" aria-hidden="true">
                {action.icon}
              </span>
            )}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
