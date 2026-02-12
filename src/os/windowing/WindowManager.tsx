import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import { WindowFrame } from "./WindowFrame";
import ExplorerApp from "../../apps/Explorer/ExplorerApp";
import TerminalApp from "../../apps/Terminal/TerminalApp";
import SettingsApp from "../../apps/Settings/SettingsApp";
import NotepadApp from "../../apps/Notepad/NotepadApp";
import RecycleBinApp from "../../apps/RecycleBin/RecycleBinApp";
import SnakeApp from "../../apps/Snake/SnakeApp";
import BouncyBallApp from "../../apps/BouncyBall/BouncyBallApp";
import type { SnapTarget } from "./snap";

type Props = {
  bounds: DOMRect | null;
};

const appContent = (appId: string, windowId: string) => {
  switch (appId) {
    case "explorer":
      return <ExplorerApp windowId={windowId} />;
    case "terminal":
      return <TerminalApp windowId={windowId} />;
    case "settings":
      return <SettingsApp windowId={windowId} />;
    case "notepad":
      return <NotepadApp windowId={windowId} />;
    case "recycle":
      return <RecycleBinApp windowId={windowId} />;
    case "snake":
      return <SnakeApp />;
    case "bouncy":
      return <BouncyBallApp />;
    default:
      return <div className="p-4 text-sm">App not found.</div>;
  }
};

const TaskbarPreview = ({ snap }: { snap: SnapTarget }) => {
  if (!snap) return null;
  return (
    <div
      className="absolute snap-preview rounded-xl pointer-events-none"
      style={{
        left: snap.x,
        top: snap.y,
        width: snap.w,
        height: snap.h,
        zIndex: 5,
      }}
    />
  );
};

const WindowManager = ({ bounds }: Props) => {
  const windows = useStore((s) => s.windows);
  const focusedId = useStore((s) => s.focusedWindowId);
  const theme = useStore((s) => s.theme);
  const focusWindow = useStore((s) => s.focusWindow);
  const closeWindow = useStore((s) => s.closeWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);
  const toggleMaximize = useStore((s) => s.toggleMaximize);
  const moveWindow = useStore((s) => s.moveWindow);
  const resizeWindow = useStore((s) => s.resizeWindow);
  const updateWindow = useStore((s) => s.updateWindow);
  const [snapPreview, setSnapPreview] = useState<SnapTarget>(null);

  const sorted = useMemo(
    () => [...windows].sort((a, b) => a.z - b.z),
    [windows]
  );

  const focusMode = useStore((s) => s.focusMode);

  return (
    <>
      <TaskbarPreview snap={snapPreview} />
      {sorted.map((win) => {
        const isFocusTarget = focusMode.active && focusMode.windowId === win.id;
        
        // Skip rendering other windows in focus mode if they aren't the focused one
        if (focusMode.active && focusMode.windowId && win.id !== focusMode.windowId) {
          return null;
        }
        
        return (
          <WindowFrame
            key={win.id}
            win={win}
            bounds={bounds}
            isFocused={focusedId === win.id}
            isFocusTarget={isFocusTarget}
            theme={theme}
            onFocus={() => focusWindow(win.id)}
            onMove={(x, y) => moveWindow(win.id, x, y)}
            onResize={(x, y, w, h) => {
              moveWindow(win.id, x, y);
              resizeWindow(win.id, w, h);
            }}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onToggleMaximize={() => toggleMaximize(win.id)}
            onSnapPreview={(snap) => setSnapPreview(snap)}
            onSnapCommit={(snap) => {
              if (snap) {
                if (snap.type === "top") {
                  updateWindow(win.id, {
                    maximized: true,
                    restore: win.maximized
                      ? win.restore
                      : { x: win.x, y: win.y, w: win.w, h: win.h },
                  });
                } else {
                  updateWindow(win.id, { maximized: false, restore: undefined });
                }
                moveWindow(win.id, snap.x, snap.y);
                resizeWindow(win.id, snap.w, snap.h);
              }
            }}
          >
            <div className="h-full">
              <div className="h-full">{appContent(win.appId, win.id)}</div>
            </div>
          </WindowFrame>
        );
      })}
    </>
  );
};

export default WindowManager;
