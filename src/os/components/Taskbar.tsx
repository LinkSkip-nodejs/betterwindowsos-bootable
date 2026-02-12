import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { appMeta, type AppId } from "../apps";

const pinnedApps: AppId[] = ["explorer", "terminal", "settings", "notepad"];

const Taskbar = () => {
  const openWindow = useStore((s) => s.openWindow);
  const windows = useStore((s) => s.windows);
  const focusedId = useStore((s) => s.focusedWindowId);
  const setStartMenuOpen = useStore((s) => s.setStartMenuOpen);
  const startMenuOpen = useStore((s) => s.startMenuOpen);
  const theme = useStore((s) => s.theme);
  const focusWindow = useStore((s) => s.focusWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);
  const closeWindow = useStore((s) => s.closeWindow);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setTime(new Date());
    const interval = window.setInterval(tick, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const taskButtons = useMemo(
    () =>
      windows.map((win) => ({
        id: win.id,
        title: win.title,
        icon: win.icon,
        minimized: win.minimized,
      })),
    [windows]
  );

  const onTaskbarContextMenu = (
    event: React.MouseEvent,
    windowId: string,
    minimized: boolean
  ) => {
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent("webos:contextmenu", {
        detail: {
          type: "taskbar",
          x: event.clientX,
          y: event.clientY,
          actions: [
            {
              id: "minimize",
              label: minimized ? "Restore" : "Minimize",
              onClick: () =>
                minimized ? focusWindow(windowId) : minimizeWindow(windowId),
            },
            {
              id: "close",
              label: "Close",
              onClick: () => closeWindow(windowId),
            },
          ],
        },
      })
    );
  };

  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const focusMode = useStore((s) => s.focusMode);

  if (focusMode.active) return null;

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 h-[54px] px-3 flex items-center gap-3 ${
        theme === "dark" ? "glass" : "glass-light"
      }`}
    >
      <button
        className={`h-9 w-9 rounded-xl text-lg hover:bg-white/10 ${
          startMenuOpen ? "bg-white/15" : ""
        }`}
        onClick={() => setStartMenuOpen(!startMenuOpen)}
      >
        ⊞
      </button>
      <div className="flex items-center gap-2">
        <div className="bg-white/10 rounded-xl px-3 h-9 flex items-center text-sm text-white/70">
          Search
        </div>
      </div>
      <div className="flex items-center gap-2">
        {pinnedApps.map((appId) => (
          <button
            key={appId}
            className="h-9 w-9 rounded-xl text-lg hover:bg-white/10"
            onClick={() => openWindow(appId)}
          >
            {appMeta[appId].icon}
          </button>
        ))}
      </div>
      <div className="flex-1 flex items-center gap-2 px-2">
        {taskButtons.map((btn) => (
          <button
            key={btn.id}
            className={`h-8 px-3 rounded-xl text-sm flex items-center gap-2 ${
              focusedId === btn.id ? "bg-white/15" : "bg-white/5"
            } hover:bg-white/15`}
            onClick={() => focusWindow(btn.id)}
            onContextMenu={(event) =>
              onTaskbarContextMenu(event, btn.id, btn.minimized)
            }
          >
            <span>{btn.icon}</span>
            <span className="truncate max-w-[120px]">{btn.title}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80">
        <button
          className={`h-9 w-9 rounded-xl text-lg hover:bg-white/10 ${
            sidebarOpen ? "bg-white/15" : ""
          }`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ⚙️
        </button>
        <span className="text-lg">🔊</span>
        <div className="text-right leading-tight">
          <div>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-xs">{time.toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
