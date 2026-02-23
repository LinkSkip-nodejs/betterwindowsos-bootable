import { useEffect, useMemo, useRef, useState } from "react";
import { useDragResize } from "./useDragResize";
import { clamp } from "../utils/clamp";
import { getSnapTarget, type SnapTarget } from "./snap";
import type { WindowState } from "../state/store";
import { sounds } from "../utils/sounds";

type WindowFrameProps = {
  win: WindowState;
  bounds: DOMRect | null;
  isFocused: boolean;
  isFocusTarget?: boolean;
  theme: "light" | "dark";
  muted: boolean;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (x: number, y: number, w: number, h: number) => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onSnapPreview: (snap: SnapTarget) => void;
  onSnapCommit: (snap: SnapTarget) => void;
  children: React.ReactNode;
};

export const WindowFrame = ({
  win,
  bounds,
  isFocused,
  isFocusTarget,
  theme,
  muted,
  onFocus,
  onMove,
  onResize,
  onClose,
  onMinimize,
  onToggleMaximize,
  onSnapPreview,
  onSnapCommit,
  children,
}: WindowFrameProps) => {
  const { startDrag, startResize } = useDragResize();
  const [isNew, setIsNew] = useState(true);
  const [closing, setClosing] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Open animation on mount
  useEffect(() => {
    const t = setTimeout(() => setIsNew(false), 350);
    return () => clearTimeout(t);
  }, []);

  const frameStyle = useMemo(() => {
    if (win.maximized && bounds) {
      return {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    }
    return {
      left: win.x,
      top: win.y,
      width: win.w,
      height: win.h,
    };
  }, [bounds, win.maximized, win.x, win.y, win.w, win.h]);

  const startWindowDrag = (event: React.PointerEvent) => {
    if (win.maximized) return;
    onFocus();
    startDrag(
      event,
      { x: win.x, y: win.y },
      {
        onMove: (x, y, clientX, clientY) => {
          if (!bounds) return;
          const nextX = clamp(x, bounds.left - win.w + 140, bounds.right - 140);
          const nextY = clamp(y, bounds.top, bounds.bottom - 40);
          onMove(nextX, nextY);
          const snap = getSnapTarget(clientX, clientY, bounds);
          onSnapPreview(snap);
        },
        onDragEnd: (clientX, clientY) => {
          if (!bounds) return;
          const target = getSnapTarget(clientX, clientY, bounds);
          if (target && !muted) sounds.snap();
          onSnapCommit(target);
          onSnapPreview(null);
        },
      }
    );
  };

  const startWindowResize = (
    event: React.PointerEvent,
    direction: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
  ) => {
    if (win.maximized) return;
    onFocus();
    startResize(
      event,
      direction,
      { x: win.x, y: win.y, w: win.w, h: win.h },
      {
        onResize: (x, y, w, h) => {
          if (!bounds) return;
          const nextX = clamp(x, bounds.left, bounds.right - 240);
          const nextY = clamp(y, bounds.top, bounds.bottom - 120);
          const nextW = clamp(w, 320, bounds.width);
          const nextH = clamp(h, 240, bounds.height);
          onResize(nextX, nextY, nextW, nextH);
        },
      }
    );
  };

  const handleClose = () => {
    if (!muted) sounds.windowClose();
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const handleMinimize = () => {
    if (!muted) sounds.minimize();
    onMinimize();
  };

  const handleMaximize = () => {
    if (!muted) sounds.maximize();
    onToggleMaximize();
  };

  const handleTitlebarContext = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("webos:contextmenu", {
        detail: {
          type: "titlebar",
          x: e.clientX,
          y: e.clientY,
          actions: [
            { id: "minimize", label: "Minimize", onClick: handleMinimize },
            { id: "maximize", label: win.maximized ? "Restore" : "Maximize", onClick: handleMaximize },
            { id: "sep1", label: "─────────", onClick: () => {} },
            { id: "close", label: "Close", onClick: handleClose },
          ],
        },
      })
    );
  };

  return (
    <div
      ref={frameRef}
      role="dialog"
      aria-label={win.title}
      className={`absolute pointer-events-auto ${isFocused ? 'window-shadow-focused' : 'window-shadow'} window-anim overflow-hidden border ${
        win.maximized ? 'rounded-none' : 'rounded-xl'
      } ${
        theme === "dark"
          ? isFocused
            ? "border-white/20 bg-slate-900/80"
            : "border-white/10 bg-slate-900/60"
          : isFocused
            ? "border-black/20 bg-white/80"
            : "border-black/10 bg-white/70"
      } ${win.minimized ? "window-minimized" : ""} ${isNew && !win.minimized ? "window-opening" : ""} ${closing ? "window-closing" : ""}`}
      style={{
        zIndex: isFocusTarget ? 1000 : win.z,
        ...frameStyle,
      }}
      onPointerDown={onFocus}
    >
      <div
        className={`flex items-center justify-between px-3 h-10 text-sm border-b select-none ${
          theme === "dark"
            ? "bg-slate-900/70 border-white/10"
            : "bg-white/70 border-black/10"
        }`}
        onPointerDown={startWindowDrag}
        onDoubleClick={handleMaximize}
        onContextMenu={handleTitlebarContext}
      >
        <div className="flex items-center gap-2 text-slate-100 min-w-0">
          <span aria-hidden="true">{win.icon}</span>
          <span className="font-medium truncate">{win.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleMinimize}
            aria-label="Minimize"
            title="Minimize"
          >
            ─
          </button>
          <button
            className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleMaximize}
            aria-label={win.maximized ? "Restore" : "Maximize"}
            title={win.maximized ? "Restore" : "Maximize"}
          >
            {win.maximized ? "🗗" : "🗖"}
          </button>
          <button
            className="h-7 w-7 rounded-md hover:bg-red-500/70 flex items-center justify-center transition-colors"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        className={`h-[calc(100%-40px)] ${
          theme === "dark" ? "bg-slate-900/60" : "bg-white/60"
        }`}
      >
        {children}
      </div>

      {!win.maximized && (
        <>
          <div
            className="resize-handle edge top-0 left-2 right-2 h-2 cursor-ns-resize"
            onPointerDown={(e) => startWindowResize(e, "n")}
          />
          <div
            className="resize-handle edge bottom-0 left-2 right-2 h-2 cursor-ns-resize"
            onPointerDown={(e) => startWindowResize(e, "s")}
          />
          <div
            className="resize-handle edge left-0 top-2 bottom-2 w-2 cursor-ew-resize"
            onPointerDown={(e) => startWindowResize(e, "w")}
          />
          <div
            className="resize-handle edge right-0 top-2 bottom-2 w-2 cursor-ew-resize"
            onPointerDown={(e) => startWindowResize(e, "e")}
          />
          <div
            className="resize-handle corner -left-1 -top-1 cursor-nwse-resize"
            onPointerDown={(e) => startWindowResize(e, "nw")}
          />
          <div
            className="resize-handle corner -right-1 -top-1 cursor-nesw-resize"
            onPointerDown={(e) => startWindowResize(e, "ne")}
          />
          <div
            className="resize-handle corner -left-1 -bottom-1 cursor-nesw-resize"
            onPointerDown={(e) => startWindowResize(e, "sw")}
          />
          <div
            className="resize-handle corner -right-1 -bottom-1 cursor-nwse-resize"
            onPointerDown={(e) => startWindowResize(e, "se")}
          />
        </>
      )}
    </div>
  );
};
