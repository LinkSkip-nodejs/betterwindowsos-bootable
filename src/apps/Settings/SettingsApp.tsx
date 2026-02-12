import { useStore, wallpaperStyles } from "../../os/state/store";

type Props = {
  windowId: string;
};

const colors = ["#4f9cf7", "#22c55e", "#f97316", "#ec4899", "#eab308"];

const SettingsApp = ({ windowId: _windowId }: Props) => {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const wallpaperId = useStore((s) => s.wallpaperId);
  const cycleWallpaper = useStore((s) => s.cycleWallpaper);
  const setAccentColor = useStore((s) => s.setAccentColor);
  const accentColor = useStore((s) => s.accentColor);
  const cursorSize = useStore((s) => s.cursorSize);
  const setCursorSize = useStore((s) => s.setCursorSize);

  return (
    <div className="h-full flex text-sm">
      <div className="w-48 border-r border-white/10 p-3 space-y-2">
        <button className="w-full text-left px-2 py-1 rounded-lg bg-white/10">
          Personalization
        </button>
        <button className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10">
          System
        </button>
      </div>
      <div className="flex-1 p-4 space-y-6">
        <section>
          <div className="font-medium mb-2">Theme</div>
          <button
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </section>
        <section>
          <div className="font-medium mb-2">Wallpaper</div>
          <div className="flex items-center gap-3">
            <div
              className="h-16 w-28 rounded-lg border border-white/20"
              style={{ backgroundImage: wallpaperStyles[wallpaperId] }}
            />
            <button
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              onClick={cycleWallpaper}
            >
              Next Wallpaper
            </button>
          </div>
        </section>
        <section>
          <div className="font-medium mb-2">Cursor size</div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-2 rounded-lg ${
                cursorSize === "small" ? "bg-white/20" : "bg-white/10"
              }`}
              onClick={() => setCursorSize("small")}
            >
              Small
            </button>
            <button
              className={`px-3 py-2 rounded-lg ${
                cursorSize === "large" ? "bg-white/20" : "bg-white/10"
              }`}
              onClick={() => setCursorSize("large")}
            >
              Large
            </button>
          </div>
        </section>
        <section>
          <div className="font-medium mb-2">Accent color</div>
          <div className="flex items-center gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className={`h-7 w-7 rounded-full border ${
                  accentColor === color ? "border-white" : "border-white/30"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setAccentColor(color)}
              />
            ))}
          </div>
        </section>
        <section>
          <div className="font-medium mb-2">System</div>
          <div className="text-xs text-white/70 space-y-1">
            <div>Better Windows Web OS</div>
            <div>Version 1.0.0</div>
            <div>Build 26000.1010</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsApp;
