import { create } from "zustand";
import { appMeta, getAppForFile, type AppId } from "../apps";
import { createId } from "../utils/id";
import { clamp } from "../utils/clamp";
import { createInitialFs } from "../fs/fsMemory";
import {
  deleteNode,
  emptyRecycleBin,
  listFolder,
  makeFile,
  makeFolder,
  renameNode,
  resolvePath,
  restoreNode,
  writeFile,
  copyNode,
  moveNode,
} from "../fs/fsOps";
import type { FsNode, FsState } from "../fs/fsTypes";
import {
  saveState,
  saveStateImmediate,
  loadState,
  clearPersistedState,
  type PersistedState,
  type GoogleAccount,
} from "../persistence";
import { audioEngine, type SoundScheme } from "../utils/sounds";

/* ── Types ─────────────────────────────────────────────────── */

export type WindowState = {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  restore?: { x: number; y: number; w: number; h: number };
  payload?: Record<string, unknown>;
};

export type DesktopItem = {
  id: string;
  name: string;
  type: "app" | "folder" | "file";
  appId?: AppId;
  fsId?: string;
  icon: string;
  payload?: Record<string, unknown>;
};

type ThemeMode = "light" | "dark";
export type FontFamily = "default" | "classic" | "mono" | "rounded";

export type WidgetType = "weather" | "clock" | "battery";

export type WidgetState = {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
  read: boolean;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
};

export type ClipboardData = {
  type: "text" | "files";
  text?: string;
  fileIds?: string[];
  cut?: boolean;
  sourceApp?: string;
} | null;

export type WifiNetwork = {
  ssid: string;
  signal: number; // 0-100
  secured: boolean;
  connected?: boolean;
};

export type StoreState = {
  // Boot
  booting: boolean;
  safeMode: boolean;
  setupComplete: boolean;

  // User
  username: string;

  // WiFi
  wifiNetworks: WifiNetwork[];
  connectedWifi: string | null;

  // Lock screen
  locked: boolean;
  lockPin: string; // legacy plaintext (migrated to hash on first use)
  lockPinHash: string; // SHA-256 hex hash

  // Clipboard
  clipboard: ClipboardData;

  // UI state
  sidebarOpen: boolean;
  startMenuOpen: boolean;
  launcherOpen: boolean;
  focusMode: {
    active: boolean;
    windowId?: string;
    timeLeft: number;
    initialTime: number;
  };

  // Effects
  matrixActive: boolean;
  coffeeBreakActive: boolean;
  updateActive: boolean;
  gravityActive: boolean;
  pulseUiActive: boolean;

  // Windows
  windows: WindowState[];
  focusedWindowId?: string;

  // Appearance
  theme: ThemeMode;
  wallpaperId: number;
  accentColor: string;
  cursorSize: "small" | "large";
  highContrast: boolean;
  rainbowMode: boolean;
  fontFamily: FontFamily;

  // Desktop
  desktopItems: DesktopItem[];
  widgets: WidgetState[];

  // Filesystem
  fs: FsState;

  // Notifications
  notifications: Notification[];
  dndMode: boolean;

  // System
  volume: number;
  muted: boolean;
  soundScheme: SoundScheme;
  online: boolean;
  batteryLevel: number;
  batteryCharging: boolean;

  // Google account
  googleAccount: GoogleAccount;

  // Logs
  logs: LogEntry[];

  // ── Actions ───────────────────────────────────────────────

  // Boot
  setBooting: (booting: boolean) => void;
  bootSafeMode: () => void;

  // Lock
  lock: () => void;
  unlock: (pin?: string) => Promise<boolean>;
  setLockPin: (pin: string) => Promise<void>;

  // Clipboard
  clipboardCopy: (type: "text" | "files", data: { text?: string; fileIds?: string[] }, sourceApp?: string) => void;
  clipboardCut: (type: "text" | "files", data: { text?: string; fileIds?: string[] }, sourceApp?: string) => void;
  clipboardPaste: () => ClipboardData;
  clipboardClear: () => void;

  // File opening
  openFile: (nodeId: string) => void;

  // Windows
  openWindow: (appId: AppId, payload?: Record<string, unknown>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  updateWindow: (id: string, data: Partial<WindowState>) => void;
  cycleWindows: () => void;
  resetWindowLayout: () => void;
  recoverOffScreenWindows: (screenW: number, screenH: number) => void;
  closeAllWindows: () => void;

  // Appearance
  setTheme: (theme: ThemeMode) => void;
  cycleWallpaper: () => void;
  setAccentColor: (color: string) => void;
  setCursorSize: (size: "small" | "large") => void;
  setHighContrast: (v: boolean) => void;
  setRainbowMode: (v: boolean) => void;
  setFontFamily: (f: FontFamily) => void;

  // Desktop
  createDesktopFolder: (name: string) => void;
  setStartMenuOpen: (open: boolean) => void;
  setLauncherOpen: (open: boolean) => void;

  // Widgets
  addWidget: (type: WidgetType, x: number, y: number) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, x: number, y: number) => void;

  // Sidebar
  setSidebarOpen: (open: boolean) => void;

  // Focus mode
  toggleFocusMode: (windowId?: string, minutes?: number) => void;
  tickFocusTimer: () => void;

  // Effects
  toggleMatrix: () => void;
  setCoffeeBreak: (active: boolean) => void;
  setUpdateScreen: (active: boolean) => void;
  setGravity: (active: boolean) => void;
  setPulseUi: (active: boolean) => void;

  // Filesystem
  fsList: (folderId: string) => FsNode[];
  fsMkdir: (parentId: string, name: string) => void;
  fsTouch: (parentId: string, name: string, content?: string) => void;
  fsRename: (id: string, name: string) => void;
  fsDelete: (id: string) => void;
  fsRestore: (id: string) => void;
  fsEmptyRecycle: () => void;
  fsWrite: (id: string, content: string) => void;
  fsResolvePath: (path: string, cwdId: string) => FsNode | undefined;
  fsCopy: (id: string, targetParentId: string) => void;
  fsMove: (id: string, targetParentId: string) => void;

  // Notifications
  notify: (title: string, message: string, type?: Notification["type"]) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
  setDndMode: (active: boolean) => void;

  // Audio
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setSoundScheme: (s: SoundScheme) => void;

  // Google account
  setGoogleAccount: (account: GoogleAccount) => void;
  clearGoogleAccount: () => void;

  // System sensors
  setOnline: (v: boolean) => void;
  setBatteryLevel: (v: number) => void;
  setBatteryCharging: (v: boolean) => void;

  // Logging
  addLog: (level: LogEntry["level"], source: string, message: string) => void;
  clearLogs: () => void;

  // Setup
  completeSetup: (username: string, pin: string, wifiSsid: string | null) => Promise<void>;
  setUsername: (name: string) => void;
  connectWifi: (ssid: string) => void;
  disconnectWifi: () => void;
  scanWifi: () => Promise<void>;
  setWifiNetworks: (networks: WifiNetwork[]) => void;

  // Recovery
  resetConfig: () => void;
  factoryReset: () => void;
};

/* ── PIN hashing ──────────────────────────────────────────── */

const hashPin = async (pin: string): Promise<string> => {
  if (!pin) return "";
  const data = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

/* ── Constants ─────────────────────────────────────────────── */

const wallpapers = [
  "linear-gradient(135deg, #0f172a, #1e293b)",
  "url('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop')",
  "url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop')",
  "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')",
  "url('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop')",
];

const MAX_LOGS = 1000;
const MAX_NOTIFICATIONS = 50;

/* ── Initial state ─────────────────────────────────────────── */

const initialFs = createInitialFs();
const desktopFolder = Object.values(initialFs.nodes).find(
  (node) => node.type === "folder" && node.name === "Desktop"
);

const baseDesktopItems: DesktopItem[] = [
  { id: createId("desk"), name: "This PC", type: "app", appId: "explorer", payload: { folderId: "root" }, icon: "🖥️" },
  { id: createId("desk"), name: "Recycle Bin", type: "app", appId: "recycle", icon: "🗑️" },
  { id: createId("desk"), name: "Snake", type: "app", appId: "snake", icon: "🐍" },
  { id: createId("desk"), name: "Bouncy", type: "app", appId: "bouncy", icon: "⚽" },
  { id: createId("desk"), name: "Terminal", type: "app", appId: "terminal", icon: "🖥️" },
  { id: createId("desk"), name: "Browser", type: "app", appId: "browser", icon: "🌐" },
  { id: createId("desk"), name: "VS Code", type: "app", appId: "vscode", icon: "💻" },
  { id: createId("desk"), name: "System Monitor", type: "app", appId: "sysmonitor", icon: "📊" },
  { id: createId("desk"), name: "AI Assistant", type: "app", appId: "aiassistant", icon: "🤖" },
  { id: createId("desk"), name: "Script Studio", type: "app", appId: "scriptstudio", icon: "🧪" },
  { id: createId("desk"), name: "Mail", type: "app", appId: "mail", icon: "📧" },
  { id: createId("desk"), name: "Chat", type: "app", appId: "chat", icon: "💬" },
  { id: createId("desk"), name: "Video Call", type: "app", appId: "videocall", icon: "📹" },
  { id: createId("desk"), name: "Music Player", type: "app", appId: "musicplayer", icon: "🎵" },
  { id: createId("desk"), name: "Video Player", type: "app", appId: "videoplayer", icon: "🎬" },
  { id: createId("desk"), name: "Photo Viewer", type: "app", appId: "photoviewer", icon: "🖼️" },
  { id: createId("desk"), name: "Paint", type: "app", appId: "paint", icon: "🎨" },
  { id: createId("desk"), name: "Calculator", type: "app", appId: "calculator", icon: "🧮" },
  { id: createId("desk"), name: "Calendar", type: "app", appId: "calendar", icon: "📅" },
  { id: createId("desk"), name: "Clock", type: "app", appId: "clock", icon: "⏰" },
  { id: createId("desk"), name: "File Compressor", type: "app", appId: "filecompressor", icon: "🗜️" },
  { id: createId("desk"), name: "Minesweeper", type: "app", appId: "minesweeper", icon: "💣" },
  { id: createId("desk"), name: "Tetris", type: "app", appId: "tetris", icon: "🟦" },
  { id: createId("desk"), name: "Flappy Bird", type: "app", appId: "flappybird", icon: "🐦" },
  { id: createId("desk"), name: "FTP Client", type: "app", appId: "ftpclient", icon: "📂" },
  { id: createId("desk"), name: "RSS Reader", type: "app", appId: "rssreader", icon: "📰" },
];

/* ── Persistence helpers ───────────────────────────────────── */

const getPersistedSnapshot = (state: StoreState): PersistedState => ({
  fs: state.fs,
  theme: state.theme,
  wallpaperId: state.wallpaperId,
  accentColor: state.accentColor,
  cursorSize: state.cursorSize,
  volume: state.volume,
  muted: state.muted,
  lockPin: "", // cleared after migration to hash
  lockPinHash: state.lockPinHash,
  dndMode: state.dndMode,
  widgets: state.widgets,
  desktopItems: state.desktopItems,
  setupComplete: state.setupComplete,
  username: state.username,
  connectedWifi: state.connectedWifi,
  soundScheme: state.soundScheme,
  fontFamily: state.fontFamily,
  googleAccount: state.googleAccount,
  _savedAt: Date.now(),
  _version: 1,
});

const persistAfterSet = (state: StoreState) => {
  saveState(getPersistedSnapshot(state));
};

/* ── Restore from persistence ──────────────────────────────── */

const restored = loadState();

const restoredFs = (restored?.fs as FsState | undefined) ?? initialFs;
const restoredTheme = (restored?.theme as ThemeMode | undefined) ?? "dark";
const restoredWallpaper = (restored?.wallpaperId as number | undefined) ?? 0;
const restoredAccent = (restored?.accentColor as string | undefined) ?? "#4f9cf7";
const restoredCursor = (restored?.cursorSize as "small" | "large" | undefined) ?? "small";
const restoredVolume = (restored?.volume as number | undefined) ?? 80;
const restoredMuted = (restored?.muted as boolean | undefined) ?? false;
const restoredPin = (restored?.lockPin as string | undefined) ?? "";
const restoredPinHash = (restored?.lockPinHash as string | undefined) ?? "";
const restoredDnd = (restored?.dndMode as boolean | undefined) ?? false;
const restoredWidgets = (restored?.widgets as WidgetState[] | undefined) ?? [
  { id: createId("widget"), type: "clock" as WidgetType, x: 40, y: 40 },
  { id: createId("widget"), type: "weather" as WidgetType, x: 40, y: 160 },
];
// Merge any new base desktop items that aren't in the persisted set
const rawRestoredDesktopItems = (restored?.desktopItems as DesktopItem[] | undefined) ?? baseDesktopItems;
const restoredDesktopItems = (() => {
  const existingAppIds = new Set(rawRestoredDesktopItems.filter((d) => d.appId).map((d) => d.appId));
  const missing = baseDesktopItems.filter((d) => d.appId && !existingAppIds.has(d.appId));
  return missing.length > 0 ? [...rawRestoredDesktopItems, ...missing] : rawRestoredDesktopItems;
})();
const restoredSetupComplete = (restored?.setupComplete as boolean | undefined) ?? false;
const restoredUsername = (restored?.username as string | undefined) ?? "";
const restoredConnectedWifi = (restored?.connectedWifi as string | null | undefined) ?? null;
const restoredSoundScheme = (restored?.soundScheme as SoundScheme | undefined) ?? "default";
const restoredFontFamily = (restored?.fontFamily as FontFamily | undefined) ?? "default";
const restoredGoogleAccount = (restored?.googleAccount as GoogleAccount | undefined) ?? null;

// Sync audio engine with restored state
audioEngine.setVolume(restoredVolume);
audioEngine.setMuted(restoredMuted);
audioEngine.setScheme(restoredSoundScheme);

/* ── WiFi (real hardware only — no fake/mock networks) ────── */

/* ── Store ─────────────────────────────────────────────────── */

export const useStore = create<StoreState>((set, get) => ({
  // Boot
  booting: true,
  safeMode: false,
  setupComplete: restoredSetupComplete,

  // User
  username: restoredUsername,

  // WiFi
  wifiNetworks: [],
  connectedWifi: restoredConnectedWifi,

  // Lock
  locked: false,
  lockPin: restoredPin,
  lockPinHash: restoredPinHash,

  // Clipboard
  clipboard: null,

  // UI
  sidebarOpen: false,
  startMenuOpen: false,
  launcherOpen: false,
  focusMode: { active: false, timeLeft: 0, initialTime: 0 },

  // Effects
  matrixActive: false,
  coffeeBreakActive: false,
  updateActive: false,
  gravityActive: false,
  pulseUiActive: false,

  // Windows
  windows: [],
  focusedWindowId: undefined,

  // Appearance (restored)
  theme: restoredTheme,
  wallpaperId: restoredWallpaper,
  accentColor: restoredAccent,
  cursorSize: restoredCursor,
  highContrast: false,
  rainbowMode: false,
  fontFamily: restoredFontFamily,

  // Desktop (restored)
  desktopItems: restoredDesktopItems,
  widgets: restoredWidgets,

  // Filesystem (restored)
  fs: restoredFs,

  // Notifications
  notifications: [],
  dndMode: restoredDnd,

  // System
  volume: restoredVolume,
  muted: restoredMuted,
  soundScheme: restoredSoundScheme,
  online: navigator.onLine,
  batteryLevel: 100,
  batteryCharging: true,

  // Google account
  googleAccount: restoredGoogleAccount,

  // Logs
  logs: [],

  /* ── Boot actions ──────────────────────────────────────── */

  setBooting: (booting) => {
    set({ booting });
    if (!booting) {
      const state = get();
      state.addLog("info", "system", "Boot completed" + (state.safeMode ? " (safe mode)" : ""));
    }
  },

  bootSafeMode: () => {
    set({
      safeMode: true,
      matrixActive: false,
      coffeeBreakActive: false,
      updateActive: false,
      gravityActive: false,
      pulseUiActive: false,
      windows: [],
      focusedWindowId: undefined,
    });
    get().addLog("warn", "system", "Booted in safe mode");
  },

  /* ── Lock screen ───────────────────────────────────────── */

  lock: () => {
    set({ locked: true, startMenuOpen: false, launcherOpen: false, sidebarOpen: false });
    get().addLog("info", "system", "Screen locked");
  },

  unlock: async (pin) => {
    const state = get();
    const storedHash = state.lockPinHash;
    // Migration: if legacy plaintext pin exists but no hash, hash it now
    if (!storedHash && state.lockPin) {
      const migrated = await hashPin(state.lockPin);
      set({ lockPinHash: migrated, lockPin: "" });
      persistAfterSet(get());
      if (pin) {
        const inputHash = await hashPin(pin);
        if (inputHash !== migrated) return false;
      }
      set({ locked: false });
      get().addLog("info", "system", "Screen unlocked (PIN migrated to hash)");
      return true;
    }
    if (storedHash && pin) {
      const inputHash = await hashPin(pin);
      if (inputHash !== storedHash) return false;
    } else if (storedHash && !pin) {
      return false;
    }
    set({ locked: false });
    get().addLog("info", "system", "Screen unlocked");
    return true;
  },

  setLockPin: async (pin) => {
    const hashed = await hashPin(pin);
    set({ lockPinHash: hashed, lockPin: "" });
    persistAfterSet(get());
    get().addLog("info", "system", pin ? "Lock PIN set" : "Lock PIN removed");
  },

  /* ── Clipboard ───────────────────────────────────────── */

  clipboardCopy: (type, data, sourceApp) => {
    set({ clipboard: { type, ...data, cut: false, sourceApp } });
  },

  clipboardCut: (type, data, sourceApp) => {
    set({ clipboard: { type, ...data, cut: true, sourceApp } });
  },

  clipboardPaste: () => get().clipboard,

  clipboardClear: () => set({ clipboard: null }),

  /* ── File opening ───────────────────────────────────── */

  openFile: (nodeId) => {
    const node = get().fs.nodes[nodeId];
    if (!node) return;
    if (node.type === "folder") {
      get().openWindow("explorer", { folderId: nodeId });
      return;
    }
    const appId = getAppForFile(node.name);
    get().openWindow(appId, { fileId: nodeId, fileName: node.name });
  },

  /* ── Window management ─────────────────────────────────── */

  openWindow: (appId, payload) => {
    const meta = appMeta[appId];
    const id = createId("win");
    const maxZ = get().windows.reduce((acc, win) => Math.max(acc, win.z), 0);
    const offset = get().windows.length * 24;
    const nextWindow: WindowState = {
      id,
      appId,
      title: meta.title,
      icon: meta.icon,
      x: 80 + offset,
      y: 60 + offset,
      w: meta.width,
      h: meta.height,
      z: maxZ + 1,
      minimized: false,
      maximized: false,
      payload,
    };
    set((state) => ({
      windows: [...state.windows, nextWindow],
      focusedWindowId: id,
      startMenuOpen: false,
      launcherOpen: false,
    }));
    get().addLog("debug", "wm", `Opened ${meta.title}`);
  },

  closeWindow: (id) => {
    const win = get().windows.find((w) => w.id === id);
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      focusedWindowId: state.focusedWindowId === id ? undefined : state.focusedWindowId,
    }));
    if (win) get().addLog("debug", "wm", `Closed ${win.title}`);
  },

  focusWindow: (id) =>
    set((state) => {
      const maxZ = state.windows.reduce((acc, win) => Math.max(acc, win.z), 0);
      return {
        windows: state.windows.map((win) =>
          win.id === id ? { ...win, z: maxZ + 1, minimized: false } : win
        ),
        focusedWindowId: id,
      };
    }),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id ? { ...win, minimized: true } : win
      ),
      focusedWindowId: state.focusedWindowId === id ? undefined : state.focusedWindowId,
    })),

  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((win) => {
        if (win.id !== id) return win;
        if (!win.maximized) {
          return { ...win, maximized: true, restore: { x: win.x, y: win.y, w: win.w, h: win.h } };
        }
        if (win.restore) {
          return { ...win, maximized: false, x: win.restore.x, y: win.restore.y, w: win.restore.w, h: win.restore.h, restore: undefined };
        }
        return { ...win, maximized: false };
      }),
    })),

  moveWindow: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((win) => (win.id === id ? { ...win, x, y } : win)),
    })),

  resizeWindow: (id, w, h) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id ? { ...win, w: clamp(w, 320, 4000), h: clamp(h, 240, 3000) } : win
      ),
    })),

  updateWindow: (id, data) =>
    set((state) => ({
      windows: state.windows.map((win) => (win.id === id ? { ...win, ...data } : win)),
    })),

  cycleWindows: () =>
    set((state) => {
      const visible = state.windows.filter((w) => !w.minimized);
      if (visible.length === 0) return state;
      const sorted = [...visible].sort((a, b) => b.z - a.z);
      const next = sorted[1] ?? sorted[0];
      return {
        windows: state.windows.map((win) =>
          win.id === next.id ? { ...win, z: sorted[0].z + 1 } : win
        ),
        focusedWindowId: next.id,
      };
    }),

  resetWindowLayout: () => {
    set((state) => ({
      windows: state.windows.map((win, i) => ({
        ...win,
        x: 80 + i * 24,
        y: 60 + i * 24,
        w: appMeta[win.appId]?.width ?? 600,
        h: appMeta[win.appId]?.height ?? 400,
        minimized: false,
        maximized: false,
        restore: undefined,
      })),
    }));
    get().addLog("info", "wm", "Window layout reset");
    get().notify("Window Manager", "All windows reset to default positions", "info");
  },

  recoverOffScreenWindows: (screenW, screenH) => {
    let recovered = 0;
    set((state) => ({
      windows: state.windows.map((win) => {
        const isOffScreen =
          win.x + win.w < 50 || win.x > screenW - 50 || win.y < -10 || win.y > screenH - 50;
        if (isOffScreen && !win.maximized) {
          recovered++;
          return { ...win, x: 80, y: 60 };
        }
        return win;
      }),
    }));
    if (recovered > 0) {
      get().addLog("warn", "wm", `Recovered ${recovered} off-screen window(s)`);
    }
  },

  closeAllWindows: () => {
    set({ windows: [], focusedWindowId: undefined });
    get().addLog("info", "wm", "All windows closed");
  },

  /* ── Appearance ────────────────────────────────────────── */

  setTheme: (theme) => {
    set({ theme });
    persistAfterSet(get());
  },

  cycleWallpaper: () => {
    set((state) => ({ wallpaperId: (state.wallpaperId + 1) % wallpapers.length }));
    persistAfterSet(get());
  },

  setAccentColor: (color) => {
    set({ accentColor: color });
    persistAfterSet(get());
  },

  setCursorSize: (size) => {
    set({ cursorSize: size });
    persistAfterSet(get());
  },

  setHighContrast: (v) => set({ highContrast: v }),
  setRainbowMode: (v) => set({ rainbowMode: v }),
  setFontFamily: (f) => {
    set({ fontFamily: f });
    persistAfterSet(get());
  },

  /* ── Desktop ───────────────────────────────────────────── */

  createDesktopFolder: (name) =>
    set((state) => {
      const desktopId = desktopFolder?.id;
      if (!desktopId) return state;
      const existingNames = Object.values(state.fs.nodes)
        .filter((node) => node.parentId === desktopId && !node.deleted)
        .map((node) => node.name);
      let finalName = name;
      let counter = 1;
      while (existingNames.includes(finalName)) {
        counter += 1;
        finalName = `${name} (${counter})`;
      }
      const newFs = makeFolder(state.fs, desktopId, finalName);
      persistAfterSet({ ...get(), fs: newFs } as StoreState);
      return { ...state, fs: newFs };
    }),

  setStartMenuOpen: (open) => set({ startMenuOpen: open, launcherOpen: open ? false : get().launcherOpen }),
  setLauncherOpen: (open) => set({ launcherOpen: open, startMenuOpen: open ? false : get().startMenuOpen }),

  /* ── Widgets ───────────────────────────────────────────── */

  addWidget: (type, x, y) => {
    set((state) => ({
      widgets: [...state.widgets, { id: createId("widget"), type, x, y }],
    }));
    persistAfterSet(get());
  },

  removeWidget: (id) => {
    set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) }));
    persistAfterSet(get());
  },

  moveWidget: (id, x, y) =>
    set((state) => ({
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  /* ── Sidebar / Focus ───────────────────────────────────── */

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleFocusMode: (windowId, minutes = 25) =>
    set((state) => {
      const active = !state.focusMode.active;
      const time = minutes * 60;
      return {
        focusMode: { active, windowId: active ? windowId : undefined, timeLeft: time, initialTime: time },
        sidebarOpen: false,
      };
    }),

  tickFocusTimer: () =>
    set((state) => {
      if (!state.focusMode.active || state.focusMode.timeLeft <= 0) return state;
      return { focusMode: { ...state.focusMode, timeLeft: state.focusMode.timeLeft - 1 } };
    }),

  /* ── Effects ───────────────────────────────────────────── */

  toggleMatrix: () => set((state) => ({ matrixActive: !state.matrixActive })),
  setCoffeeBreak: (active) => set({ coffeeBreakActive: active }),
  setUpdateScreen: (active) => set({ updateActive: active }),
  setGravity: (active) => set({ gravityActive: active }),
  setPulseUi: (active) => set({ pulseUiActive: active }),

  /* ── Filesystem ────────────────────────────────────────── */

  fsList: (folderId) => listFolder(get().fs, folderId),

  fsMkdir: (parentId, name) => {
    set((state) => ({ fs: makeFolder(state.fs, parentId, name) }));
    persistAfterSet(get());
  },

  fsTouch: (parentId, name, content = "") => {
    set((state) => ({ fs: makeFile(state.fs, parentId, name, content) }));
    persistAfterSet(get());
  },

  fsRename: (id, name) => {
    set((state) => ({ fs: renameNode(state.fs, id, name) }));
    persistAfterSet(get());
  },

  fsDelete: (id) => {
    const node = get().fs.nodes[id];
    set((state) => ({ fs: deleteNode(state.fs, id) }));
    persistAfterSet(get());
    if (node) get().addLog("info", "fs", `Deleted "${node.name}"`);
  },

  fsRestore: (id) => {
    set((state) => ({ fs: restoreNode(state.fs, id) }));
    persistAfterSet(get());
  },

  fsEmptyRecycle: () => {
    const count = get().fs.recycleBin.length;
    set((state) => ({ fs: emptyRecycleBin(state.fs) }));
    persistAfterSet(get());
    get().addLog("info", "fs", `Emptied recycle bin (${count} items)`);
  },

  fsWrite: (id, content) => {
    set((state) => ({ fs: writeFile(state.fs, id, content) }));
    persistAfterSet(get());
  },

  fsResolvePath: (path, cwdId) => resolvePath(get().fs, path, cwdId),

  fsCopy: (id, targetParentId) => {
    set((state) => ({ fs: copyNode(state.fs, id, targetParentId) }));
    persistAfterSet(get());
    const node = get().fs.nodes[id];
    if (node) get().addLog("info", "fs", `Copied "${node.name}"`);
  },

  fsMove: (id, targetParentId) => {
    const node = get().fs.nodes[id];
    set((state) => ({ fs: moveNode(state.fs, id, targetParentId) }));
    persistAfterSet(get());
    if (node) get().addLog("info", "fs", `Moved "${node.name}"`);
  },

  /* ── Notifications ─────────────────────────────────────── */

  notify: (title, message, type = "info") => {
    if (get().dndMode) return;
    const notif: Notification = {
      id: createId("notif"),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    set((state) => ({
      notifications: [notif, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));
  },

  dismissNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  clearNotifications: () => set({ notifications: [] }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  setDndMode: (active) => {
    set({ dndMode: active });
    persistAfterSet(get());
  },

  /* ── Audio ─────────────────────────────────────────────── */

  setVolume: (v) => {
    const vol = clamp(v, 0, 100);
    set({ volume: vol });
    audioEngine.setVolume(vol);
    persistAfterSet(get());
  },

  toggleMute: () => {
    const newMuted = !get().muted;
    set({ muted: newMuted });
    audioEngine.setMuted(newMuted);
    persistAfterSet(get());
  },

  setSoundScheme: (s) => {
    audioEngine.setScheme(s);
    set({ soundScheme: s });
    persistAfterSet(get());
  },

  /* ── Google account ─────────────────────────────────────── */

  setGoogleAccount: (account) => {
    set({ googleAccount: account });
    persistAfterSet(get());
  },

  clearGoogleAccount: () => {
    set({ googleAccount: null });
    persistAfterSet(get());
  },

  /* ── System sensors ────────────────────────────────────── */

  setOnline: (v) => {
    const was = get().online;
    set({ online: v });
    if (was && !v) {
      get().addLog("warn", "network", "Network connection lost");
      get().notify("Network", "Connection lost", "warning");
    }
    if (!was && v) {
      get().addLog("info", "network", "Network connection restored");
      get().notify("Network", "Connection restored", "success");
    }
  },

  setBatteryLevel: (v) => set({ batteryLevel: v }),
  setBatteryCharging: (v) => {
    const was = get().batteryCharging;
    set({ batteryCharging: v });
    if (!was && v) get().notify("Power", "Charging", "info");
    if (was && !v) get().notify("Power", "Unplugged", "info");
  },

  /* ── Logging ───────────────────────────────────────────── */

  addLog: (level, source, message) =>
    set((state) => ({
      logs: [
        { id: createId("log"), timestamp: Date.now(), level, source, message },
        ...state.logs,
      ].slice(0, MAX_LOGS),
    })),

  clearLogs: () => set({ logs: [] }),

  /* ── Setup ────────────────────────────────────────────── */

  completeSetup: async (username, pin, wifiSsid) => {
    const hashed = await hashPin(pin);
    set({
      setupComplete: true,
      username,
      lockPin: "",
      lockPinHash: hashed,
      connectedWifi: wifiSsid,
      wifiNetworks: get().wifiNetworks.map((n) => ({
        ...n,
        connected: n.ssid === wifiSsid,
      })),
    });
    persistAfterSet(get());
    get().addLog("info", "system", `Setup completed for user "${username}"`);
  },

  setUsername: (name) => {
    set({ username: name });
    persistAfterSet(get());
  },

  connectWifi: (ssid) => {
    // Update state to reflect the connection (actual system connect
    // is done via electronAPI.wifi.connect in the UI layer)
    set({
      connectedWifi: ssid,
      online: true,
      wifiNetworks: get().wifiNetworks.map((n) => ({
        ...n,
        connected: n.ssid === ssid,
      })),
    });
    persistAfterSet(get());
    get().addLog("info", "network", `Connected to "${ssid}"`);
  },

  disconnectWifi: async () => {
    // Disconnect via system command if in Electron
    if (window.electronAPI?.wifi) {
      try {
        await window.electronAPI.wifi.disconnect();
      } catch {
        get().addLog("warn", "network", "System WiFi disconnect failed");
      }
    }
    set({
      connectedWifi: null,
      online: false,
      wifiNetworks: get().wifiNetworks.map((n) => ({ ...n, connected: false })),
    });
    persistAfterSet(get());
    get().addLog("info", "network", "Disconnected from WiFi");
  },

  scanWifi: async () => {
    if (window.electronAPI?.wifi) {
      try {
        const networks = await window.electronAPI.wifi.scan();
        const current = await window.electronAPI.wifi.current();
        set({
          wifiNetworks: networks.map((n) => ({
            ...n,
            connected: n.ssid === current,
          })),
          connectedWifi: current,
          online: !!current,
        });
        get().addLog("info", "network", `Scanned ${networks.length} WiFi network(s)`);
      } catch {
        get().addLog("warn", "network", "WiFi scan failed — no WiFi hardware detected");
        set({ wifiNetworks: [], connectedWifi: null });
      }
    } else {
      // Not in Electron — no real WiFi available
      get().addLog("warn", "network", "WiFi not available (not running in Electron)");
      set({ wifiNetworks: [] });
    }
  },

  setWifiNetworks: (networks) => set({ wifiNetworks: networks }),

  /* ── Recovery ──────────────────────────────────────────── */

  resetConfig: () => {
    set({
      theme: "dark",
      wallpaperId: 0,
      accentColor: "#4f9cf7",
      cursorSize: "small",
      volume: 80,
      muted: false,
      dndMode: false,
      lockPin: "",
      lockPinHash: "",
    });
    persistAfterSet(get());
    get().addLog("warn", "system", "Configuration reset to defaults");
    get().notify("System", "Settings reset to defaults", "info");
  },

  factoryReset: () => {
    clearPersistedState();
    set({ setupComplete: false, username: "", lockPin: "", lockPinHash: "", connectedWifi: null });
    get().addLog("warn", "system", "Factory reset — reloading");
    setTimeout(() => window.location.reload(), 500);
  },
}));

/* ── Auto-save on beforeunload ─────────────────────────────── */

window.addEventListener("beforeunload", () => {
  const state = useStore.getState();
  saveStateImmediate(getPersistedSnapshot(state));
});

/* ── Periodic auto-save (every 30s, deferred to idle) ─────── */

setInterval(() => {
  const state = useStore.getState();
  if (!state.booting) {
    const doSave = () => saveStateImmediate(getPersistedSnapshot(state));
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(doSave, { timeout: 5000 });
    } else {
      doSave();
    }
  }
}, 30000);

/* ── Exports ───────────────────────────────────────────────── */

export const wallpaperStyles = wallpapers;
