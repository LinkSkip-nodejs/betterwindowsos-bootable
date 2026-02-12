import { useStore } from "../state/store";
import { appMeta, type AppId } from "../apps";

const appList: AppId[] = ["explorer", "terminal", "settings", "notepad"];

const StartMenu = () => {
  const startMenuOpen = useStore((s) => s.startMenuOpen);
  const setStartMenuOpen = useStore((s) => s.setStartMenuOpen);
  const openWindow = useStore((s) => s.openWindow);
  const theme = useStore((s) => s.theme);

  if (!startMenuOpen) return null;

  return (
    <div
      className={`absolute bottom-[62px] left-4 z-40 w-80 rounded-2xl shadow-glass p-4 animate-[fadeIn_0.18s_ease] ${
        theme === "dark" ? "glass" : "glass-light"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            😊
          </div>
          <div>
            <div className="font-medium">YouTube Creator</div>
            <div className="text-xs text-white/60">Local account</div>
          </div>
        </div>
        <button
          className="h-8 w-8 rounded-lg hover:bg-white/10"
          onClick={() => setStartMenuOpen(false)}
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        {appList.map((appId) => (
          <button
            key={appId}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
            onClick={() => openWindow(appId)}
          >
            <span>{appMeta[appId].icon}</span>
            <span>{appMeta[appId].title}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
        <button
          className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
          onClick={() => setStartMenuOpen(false)}
        >
          Sleep
        </button>
        <button
          className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
          onClick={() => setStartMenuOpen(false)}
        >
          Shut down
        </button>
      </div>
    </div>
  );
};

export default StartMenu;
