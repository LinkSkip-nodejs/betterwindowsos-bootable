import { useStore } from "../state/store";
import { appMeta, type AppId } from "../apps";
import { sounds } from "../utils/sounds";

const appList: AppId[] = [
  "explorer",
  "terminal",
  "browser",
  "vscode",
  "settings",
  "notepad",
  "sysmonitor",
  "mail",
  "chat",
  "videocall",
  "musicplayer",
  "videoplayer",
  "photoviewer",
  "paint",
  "calculator",
  "calendar",
  "clock",
  "filecompressor",
  "minesweeper",
  "tetris",
  "flappybird",
  "ftpclient",
  "rssreader",
];

const StartMenu = () => {
  const startMenuOpen = useStore((s) => s.startMenuOpen);
  const setStartMenuOpen = useStore((s) => s.setStartMenuOpen);
  const openWindow = useStore((s) => s.openWindow);
  const theme = useStore((s) => s.theme);
  const lock = useStore((s) => s.lock);
  const safeMode = useStore((s) => s.safeMode);
  const bootSafeMode = useStore((s) => s.bootSafeMode);
  const resetConfig = useStore((s) => s.resetConfig);
  const muted = useStore((s) => s.muted);
  const username = useStore((s) => s.username);

  if (!startMenuOpen) return null;

  const handleApp = (appId: AppId) => {
    if (!muted) sounds.click();
    openWindow(appId);
    setStartMenuOpen(false);
  };

  const handleLock = () => {
    if (!muted) sounds.lock();
    lock();
    setStartMenuOpen(false);
  };

  return (
    <div
      className={`absolute bottom-[62px] left-4 z-40 w-80 rounded-2xl p-4 animate-[slideUp_0.2s_ease-out] ${
        theme === "dark" ? "glass" : "glass-light"
      }`}
      style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.4)" }}
      role="dialog"
      aria-label="Start menu"
    >
      {/* User profile */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-lg">
            😊
          </div>
          <div>
            <div className="font-medium">{username || "User"}</div>
            <div className="text-xs text-white/50">
              Local account{safeMode ? " (Safe Mode)" : ""}
            </div>
          </div>
        </div>
        <button
          className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
          onClick={() => setStartMenuOpen(false)}
          aria-label="Close start menu"
        >
          ✕
        </button>
      </div>

      {/* Apps */}
      <div className="space-y-0.5">
        {appList.map((appId, i) => (
          <button
            key={appId}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors"
            onClick={() => handleApp(appId)}
            style={{ animation: `slideUp 0.15s ease ${i * 0.03}s both` }}
          >
            <span aria-hidden="true">{appMeta[appId].icon}</span>
            <span>{appMeta[appId].title}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 border-t border-white/10 pt-3 flex flex-wrap items-center gap-1.5">
        <button
          className="px-3 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors"
          onClick={handleLock}
        >
          🔒 Lock
        </button>
        {!safeMode && (
          <button
            className="px-3 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors"
            onClick={() => {
              if (!muted) sounds.click();
              bootSafeMode();
              setStartMenuOpen(false);
            }}
          >
            🛡️ Safe Mode
          </button>
        )}
        <button
          className="px-3 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors"
          onClick={() => {
            if (!muted) sounds.click();
            resetConfig();
            setStartMenuOpen(false);
          }}
        >
          🔄 Reset
        </button>
        <button
          className="px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-white/50 transition-colors"
          onClick={() => setStartMenuOpen(false)}
        >
          💤 Sleep
        </button>
        <button
          className="px-3 py-2 rounded-xl hover:bg-red-500/10 text-sm transition-colors"
          onClick={() => {
            setStartMenuOpen(false);
            useStore.getState().factoryReset();
          }}
        >
          ⏻ Shut down
        </button>
      </div>
    </div>
  );
};

export default StartMenu;
