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
import LockScreen from "./os/components/LockScreen";
import NotificationCenter from "./os/components/NotificationCenter";
import AppLauncher from "./os/components/AppLauncher";
import SetupWizard from "./os/components/SetupWizard";
import NotificationToast from "./os/components/NotificationToast";
import { registerHotkeys } from "./os/utils/hotkeys";
import { useStore, wallpaperStyles, type FontFamily } from "./os/state/store";
import { sounds } from "./os/utils/sounds";

const fontFamilyMap: Record<FontFamily, { main: string; mono: string }> = {
  default: { main: '"Inter", system-ui, sans-serif', mono: '"JetBrains Mono", "Cascadia Code", monospace' },
  classic: { main: '"Segoe UI", system-ui, sans-serif', mono: '"Cascadia Code", "Consolas", monospace' },
  mono: { main: '"JetBrains Mono", monospace', mono: '"JetBrains Mono", monospace' },
  rounded: { main: '"Nunito", system-ui, sans-serif', mono: '"JetBrains Mono", monospace' },
};

const App = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useStore((s) => s.theme);
  const accentColor = useStore((s) => s.accentColor);
  const cursorSize = useStore((s) => s.cursorSize);
  const booting = useStore((s) => s.booting);
  const setBooting = useStore((s) => s.setBooting);
  const pulseUiActive = useStore((s) => s.pulseUiActive);
  const highContrast = useStore((s) => s.highContrast);
  const rainbowMode = useStore((s) => s.rainbowMode);
  const setOnline = useStore((s) => s.setOnline);
  const setBatteryLevel = useStore((s) => s.setBatteryLevel);
  const setBatteryCharging = useStore((s) => s.setBatteryCharging);
  const recoverOffScreenWindows = useStore((s) => s.recoverOffScreenWindows);
  const setupComplete = useStore((s) => s.setupComplete);
  const fontFamily = useStore((s) => s.fontFamily);

  const [bounds, setBounds] = useState<DOMRect | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Hotkeys
  useEffect(() => {
    const cleanup = registerHotkeys();
    return cleanup;
  }, []);

  // Theme sync
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [theme, accentColor]);

  // Font family sync
  useEffect(() => {
    const fonts = fontFamilyMap[fontFamily];
    document.documentElement.style.setProperty("--font-family", fonts.main);
    document.documentElement.style.setProperty("--font-mono", fonts.mono);
  }, [fontFamily]);

  // High contrast sync
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  // Bounds tracking + off-screen recovery
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
      recoverOffScreenWindows(rect.width, rect.height - 54);
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [recoverOffScreenWindows]);

  // Network detection
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOnline]);

  // Battery detection
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const init = async () => {
      try {
        const nav = navigator as Navigator & {
          getBattery?: () => Promise<{
            level: number;
            charging: boolean;
            addEventListener: (event: string, cb: () => void) => void;
            removeEventListener: (event: string, cb: () => void) => void;
          }>;
        };
        if (!nav.getBattery) return;
        const battery = await nav.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        setBatteryCharging(battery.charging);
        const onLevel = () => setBatteryLevel(Math.round(battery.level * 100));
        const onCharging = () => setBatteryCharging(battery.charging);
        battery.addEventListener("levelchange", onLevel);
        battery.addEventListener("chargingchange", onCharging);
        cleanup = () => {
          battery.removeEventListener("levelchange", onLevel);
          battery.removeEventListener("chargingchange", onCharging);
        };
      } catch {
        // Battery API not available
      }
    };
    init();
    return () => cleanup?.();
  }, [setBatteryLevel, setBatteryCharging]);

  // Notification center toggle (from taskbar bell)
  useEffect(() => {
    const handler = () => setNotifOpen((prev) => !prev);
    window.addEventListener("webos:toggle-notifications", handler);
    return () => window.removeEventListener("webos:toggle-notifications", handler);
  }, []);

  // Setup wizard on first boot
  useEffect(() => {
    if (!booting && !setupComplete) {
      setShowSetup(true);
    }
  }, [booting, setupComplete]);

  // Konami code easter egg
  useEffect(() => {
    const konamiCode = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    let index = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[index]) {
        index++;
        if (index === konamiCode.length) {
          index = 0;
          useStore.getState().setRainbowMode(
            !useStore.getState().rainbowMode
          );
          if (!useStore.getState().muted) sounds.notification();
          useStore.getState().notify(
            "Easter Egg",
            rainbowMode ? "Rainbow mode deactivated!" : "Rainbow mode activated!",
            "success"
          );
        }
      } else {
        index = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rainbowMode]);

  const cursorClass = useMemo(
    () => (cursorSize === "large" ? "cursor-large" : "cursor-small"),
    [cursorSize]
  );

  const wallpaperId = useStore((s) => s.wallpaperId);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-slate-900 bg-cover bg-center transition-[background-image] duration-500 ${cursorClass} ${pulseUiActive ? "pulse-ui" : ""} ${rainbowMode ? "rainbow-mode" : ""}`}
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
          <AppLauncher />
          <Sidebar />
          <FocusOverlay />
          <MatrixEffect />
          <CoffeeBreak />
          <UpdateScreen />
          <ActiveEffectsIndicator />
          <ContextMenu />
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
          <NotificationToast />
          <LockScreen />
          {showSetup && <SetupWizard onComplete={() => setShowSetup(false)} />}
        </>
      )}
    </div>
  );
};

export default App;
