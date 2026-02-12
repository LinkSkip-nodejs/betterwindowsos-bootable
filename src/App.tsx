import { useEffect, useMemo, useRef, useState } from "react";
import Desktop from "./os/components/Desktop";
import Taskbar from "./os/components/Taskbar";
import StartMenu from "./os/components/StartMenu";
import ContextMenu from "./os/components/ContextMenu";
import WindowManager from "./os/windowing/WindowManager";
import LoadingScreen from "./os/components/LoadingScreen";
import Sidebar from "./os/components/Sidebar";
import FocusOverlay from "./os/components/FocusOverlay";
import MatrixEffect from "./os/components/effects/MatrixEffect";
import CoffeeBreak from "./os/components/effects/CoffeeBreak";
import UpdateScreen from "./os/components/effects/UpdateScreen";
import ActiveEffectsIndicator from "./os/components/effects/ActiveEffectsIndicator";
import { registerHotkeys } from "./os/utils/hotkeys";
import { useStore, wallpaperStyles } from "./os/state/store";

const App = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useStore((s) => s.theme);
  const accentColor = useStore((s) => s.accentColor);
  const cursorSize = useStore((s) => s.cursorSize);
  const booting = useStore((s) => s.booting);
  const setBooting = useStore((s) => s.setBooting);
  const pulseUiActive = useStore((s) => s.pulseUiActive);

  const [bounds, setBounds] = useState<DOMRect | null>(null);

  useEffect(() => {
    const cleanup = registerHotkeys();
    return cleanup;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [theme, accentColor]);

  useEffect(() => {
    const updateBounds = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setBounds(
        new DOMRect(
          rect.left,
          rect.top,
          rect.width,
          rect.height - 54
        )
      );
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  const cursorClass = useMemo(
    () => (cursorSize === "large" ? "cursor-large" : "cursor-small"),
    [cursorSize]
  );

  const wallpaperId = useStore((s) => s.wallpaperId);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-slate-900 bg-cover bg-center transition-[background-image] duration-500 ${cursorClass} ${pulseUiActive ? 'pulse-ui' : ''}`}
      style={{ backgroundImage: wallpaperStyles[wallpaperId] }}
    >
      {booting ? (
        <LoadingScreen onComplete={() => setBooting(false)} />
      ) : (
        <>
          <Desktop />
          <WindowManager bounds={bounds} />
          <Taskbar />
          <StartMenu />
          <Sidebar />
          <FocusOverlay />
          <MatrixEffect />
          <CoffeeBreak />
          <UpdateScreen />
          <ActiveEffectsIndicator />
          <ContextMenu />
        </>
      )}
    </div>
  );
};

export default App;
