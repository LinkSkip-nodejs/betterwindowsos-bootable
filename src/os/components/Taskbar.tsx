import { memo, useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import { appMeta, type AppId } from "../apps";
import { sounds } from "../utils/sounds";

const pinnedApps: AppId[] = ["explorer", "terminal", "browser", "vscode", "settings", "notepad"];

const Taskbar = memo(() => {
  const openWindow = useStore((s) => s.openWindow);
  const focusedId = useStore((s) => s.focusedWindowId);
  const setStartMenuOpen = useStore((s) => s.setStartMenuOpen);
  const startMenuOpen = useStore((s) => s.startMenuOpen);
  const theme = useStore((s) => s.theme);
  const focusWindow = useStore((s) => s.focusWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);
  const closeWindow = useStore((s) => s.closeWindow);
  const muted = useStore((s) => s.muted);

  // System indicators
  const volume = useStore((s) => s.volume);
  const toggleMute = useStore((s) => s.toggleMute);
  const online = useStore((s) => s.online);
  const connectedWifi = useStore((s) => s.connectedWifi);
  const batteryLevel = useStore((s) => s.batteryLevel);
  const batteryCharging = useStore((s) => s.batteryCharging);
  const unreadCount = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const dndMode = useStore((s) => s.dndMode);

  // Only re-render when task button data actually changes (not on every window z-order bump)
  const taskButtons = useStore(
    useShallow((s) =>
      s.windows.map((win) => ({
        id: win.id,
        appId: win.appId,
        title: win.title,
        icon: win.icon,
        minimized: win.minimized,
      }))
    )
  );

  // Derive which pinned apps have open windows
  const openAppIds = useStore(
    useShallow((s) => s.windows.map((w) => w.appId))
  );

  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setTime(new Date());
    tick();
    const interval = window.setInterval(tick, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const batteryIcon = batteryCharging ? "🔌" : batteryLevel > 60 ? "🔋" : "🪫";
  const volumeIcon = muted ? "🔇" : volume > 50 ? "🔊" : volume > 0 ? "🔉" : "🔈";
  const networkIcon = online ? "📶" : "📵";

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
          y: event.clientY - 100,
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

  const handleStartMenu = () => {
    if (!muted) sounds.click();
    setStartMenuOpen(!startMenuOpen);
  };

  const handlePinnedApp = (appId: AppId) => {
    if (!muted) sounds.click();
    openWindow(appId);
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 h-[54px] px-3 flex items-center gap-3 ${
        theme === "dark" ? "glass" : "glass-light"
      }`}
      role="toolbar"
      aria-label="Taskbar"
    >
      {/* Start button */}
      <div className="tooltip-trigger relative">
        <button
          className={`taskbar-btn h-9 w-9 rounded-xl text-lg hover:bg-white/10 flex items-center justify-center ${
            startMenuOpen ? "bg-white/15 active" : ""
          }`}
          onClick={handleStartMenu}
          aria-label="Start menu"
        >
          ⊞
        </button>
        <div className="tooltip">Start</div>
      </div>

      {/* Search */}
      <button
        className="bg-white/10 rounded-xl px-3 h-9 flex items-center text-sm text-white/50 hover:bg-white/15 transition-colors gap-2"
        onClick={() => {
          if (!muted) sounds.click();
          useStore.getState().setLauncherOpen(true);
        }}
        aria-label="Search"
      >
        <span className="text-xs">🔍</span>
        <span>Search</span>
      </button>

      {/* Pinned apps */}
      <div className="flex items-center gap-1">
        {pinnedApps.map((appId) => {
          const hasOpen = openAppIds.includes(appId);
          return (
            <div key={appId} className="tooltip-trigger relative">
              <button
                className={`taskbar-btn h-9 w-9 rounded-xl text-lg hover:bg-white/10 flex items-center justify-center ${
                  hasOpen ? "active" : ""
                }`}
                onClick={() => handlePinnedApp(appId)}
                aria-label={appMeta[appId].title}
              >
                {appMeta[appId].icon}
              </button>
              <div className="tooltip">{appMeta[appId].title}</div>
            </div>
          );
        })}
      </div>

      {/* Running window buttons */}
      <div className="flex-1 flex items-center gap-1 px-2 overflow-x-auto">
        {taskButtons.map((btn) => (
          <button
            key={btn.id}
            className={`taskbar-btn h-8 px-3 rounded-xl text-sm flex items-center gap-2 shrink-0 ${
              focusedId === btn.id ? "bg-white/15 active" : "bg-white/5"
            } hover:bg-white/15`}
            onClick={() => {
              if (!muted) sounds.click();
              focusWindow(btn.id);
            }}
            onContextMenu={(event) =>
              onTaskbarContextMenu(event, btn.id, btn.minimized)
            }
            title={btn.title}
          >
            <span aria-hidden="true">{btn.icon}</span>
            <span className="truncate max-w-[120px]">{btn.title}</span>
          </button>
        ))}
      </div>

      {/* System tray */}
      <div className="flex items-center gap-1.5 text-sm text-white/80">
        <div className="tooltip-trigger relative">
          <span
            className="text-xs px-1 py-0.5 rounded"
            aria-label={online ? "Network: Online" : "Network: Offline"}
          >
            {networkIcon}
          </span>
          <div className="tooltip">{online ? (connectedWifi ?? "Connected") : "Offline"}</div>
        </div>

        <div className="tooltip-trigger relative">
          <button
            className="text-xs hover:bg-white/10 rounded px-1.5 py-0.5 transition-colors"
            onClick={() => {
              toggleMute();
              if (!muted) sounds.click();
            }}
            aria-label={muted ? "Unmute" : `Volume: ${volume}%`}
          >
            {volumeIcon}
          </button>
          <div className="tooltip">{muted ? "Muted" : `Volume: ${volume}%`}</div>
        </div>

        <div className="tooltip-trigger relative">
          <span
            className="text-xs px-1 py-0.5 rounded"
            aria-label={`Battery: ${batteryLevel}%${batteryCharging ? ", Charging" : ""}`}
          >
            {batteryIcon}
            <span className="text-[10px] ml-0.5">{batteryLevel}%</span>
          </span>
          <div className="tooltip">
            Battery: {batteryLevel}%{batteryCharging ? " (Charging)" : ""}
          </div>
        </div>

        <div className="tooltip-trigger relative">
          <button
            className="relative h-8 w-8 rounded-xl text-sm hover:bg-white/10 flex items-center justify-center transition-colors"
            onClick={() => {
              if (!muted) sounds.click();
              window.dispatchEvent(new CustomEvent("webos:toggle-notifications"));
            }}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            {dndMode ? "🔕" : "🔔"}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-[popIn_0.3s_ease]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <div className="tooltip">Notifications</div>
        </div>

        <div className="tooltip-trigger relative">
          <button
            className={`taskbar-btn h-9 w-9 rounded-xl text-lg hover:bg-white/10 flex items-center justify-center ${
              sidebarOpen ? "bg-white/15 active" : ""
            }`}
            onClick={() => {
              if (!muted) sounds.click();
              setSidebarOpen(!sidebarOpen);
            }}
            aria-label="Widgets & Settings"
          >
            ⚙️
          </button>
          <div className="tooltip">Widgets</div>
        </div>

        <div className="text-right leading-tight pl-1">
          <div className="text-sm">{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-[10px] text-white/50">{time.toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
});

Taskbar.displayName = "Taskbar";
export default Taskbar;
