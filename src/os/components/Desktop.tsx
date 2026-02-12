import DesktopIcons from "./DesktopIcons";
import { useStore, wallpaperStyles } from "../state/store";
import WidgetManager from "./widgets/WidgetManager";

const Desktop = () => {
  const theme = useStore((s) => s.theme);
  const wallpaperId = useStore((s) => s.wallpaperId);
  const cycleWallpaper = useStore((s) => s.cycleWallpaper);
  const setTheme = useStore((s) => s.setTheme);
  const createDesktopFolder = useStore((s) => s.createDesktopFolder);
  const addWidget = useStore((s) => s.addWidget);
  const focusMode = useStore((s) => s.focusMode);

  const onContextMenu = (event: React.MouseEvent) => {
    if (focusMode.active) return;
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent("webos:contextmenu", {
        detail: {
          type: "desktop",
          x: event.clientX,
          y: event.clientY,
          actions: [
            {
              id: "refresh",
              label: "Refresh",
              onClick: () => {},
            },
            {
              id: "wallpaper",
              label: "Next Wallpaper",
              onClick: () => cycleWallpaper(),
            },
            {
              id: "theme",
              label: theme === "dark" ? "Switch to Light" : "Switch to Dark",
              onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
            },
            {
              id: "new-folder",
              label: "New Folder",
              onClick: () => createDesktopFolder("New Folder"),
            },
            {
              id: "add-weather",
              label: "Add Weather Widget",
              onClick: () => addWidget("weather", event.clientX, event.clientY),
            },
            {
              id: "add-clock",
              label: "Add Clock Widget",
              onClick: () => addWidget("clock", event.clientX, event.clientY),
            },
            {
              id: "add-battery",
              label: "Add Battery Widget",
              onClick: () => addWidget("battery", event.clientX, event.clientY),
            },
          ],
        },
      })
    );
  };

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${focusMode.active ? 'pointer-events-none opacity-50 transition-opacity duration-1000' : ''}`}
      onContextMenu={onContextMenu}
      style={{
        pointerEvents: "auto",
      }}
    >
      <DesktopIcons />
      <WidgetManager />
    </div>
  );
};

export default Desktop;
