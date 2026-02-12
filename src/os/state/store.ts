import { create } from "zustand";
import { appMeta, type AppId } from "../apps";
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
} from "../fs/fsOps";
import type { FsNode, FsState } from "../fs/fsTypes";

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

export type WidgetType = "weather" | "clock" | "battery";

export type WidgetState = {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
};

export type StoreState = {
  booting: boolean;
  sidebarOpen: boolean;
  focusMode: {
    active: boolean;
    windowId?: string;
    timeLeft: number;
    initialTime: number;
  };
  matrixActive: boolean;
  coffeeBreakActive: boolean;
  updateActive: boolean;
  gravityActive: boolean;
  pulseUiActive: boolean;
  windows: WindowState[];
  focusedWindowId?: string;
  startMenuOpen: boolean;
  theme: ThemeMode;
  wallpaperId: number;
  accentColor: string;
  cursorSize: "small" | "large";
  desktopItems: DesktopItem[];
  widgets: WidgetState[];
  fs: FsState;
  setBooting: (booting: boolean) => void;
  openWindow: (appId: AppId, payload?: Record<string, unknown>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  setTheme: (theme: ThemeMode) => void;
  cycleWallpaper: () => void;
  createDesktopFolder: (name: string) => void;
  setStartMenuOpen: (open: boolean) => void;
  cycleWindows: () => void;
  setAccentColor: (color: string) => void;
  setCursorSize: (size: "small" | "large") => void;
  fsList: (folderId: string) => FsNode[];
  fsMkdir: (parentId: string, name: string) => void;
  fsTouch: (parentId: string, name: string, content?: string) => void;
  fsRename: (id: string, name: string) => void;
  fsDelete: (id: string) => void;
  fsRestore: (id: string) => void;
  fsEmptyRecycle: () => void;
  fsWrite: (id: string, content: string) => void;
  fsResolvePath: (path: string, cwdId: string) => FsNode | undefined;
  updateWindow: (id: string, data: Partial<WindowState>) => void;
  addWidget: (type: WidgetType, x: number, y: number) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, x: number, y: number) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFocusMode: (windowId?: string, minutes?: number) => void;
  tickFocusTimer: () => void;
  toggleMatrix: () => void;
  setCoffeeBreak: (active: boolean) => void;
  setUpdateScreen: (active: boolean) => void;
  setGravity: (active: boolean) => void;
  setPulseUi: (active: boolean) => void;
};

const wallpapers = [
  "linear-gradient(135deg, #0f172a, #1e293b)",
  "url('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop')",
  "url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop')",
  "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')",
  "url('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop')",
];

const initialFs = createInitialFs();
const desktopFolder = Object.values(initialFs.nodes).find(
  (node) => node.type === "folder" && node.name === "Desktop"
);

const baseDesktopItems: DesktopItem[] = [
  {
    id: createId("desk"),
    name: "This PC",
    type: "app",
    appId: "explorer",
    payload: { folderId: "root" },
    icon: "🖥️",
  },
  {
    id: createId("desk"),
    name: "Recycle Bin",
    type: "app",
    appId: "recycle",
    icon: "🗑️",
  },
  {
    id: createId("desk"),
    name: "Snake",
    type: "app",
    appId: "snake",
    icon: "🐍",
  },
  {
    id: createId("desk"),
    name: "Bouncy",
    type: "app",
    appId: "bouncy",
    icon: "⚽",
  },
  {
    id: createId("desk"),
    name: "Terminal",
    type: "app",
    appId: "terminal",
    icon: "🖥️",
  },
];

export const useStore = create<StoreState>((set, get) => ({
  booting: true,
  sidebarOpen: false,
  focusMode: {
    active: false,
    timeLeft: 0,
    initialTime: 0,
  },
  matrixActive: false,
  coffeeBreakActive: false,
  updateActive: false,
  gravityActive: false,
  pulseUiActive: false,
  windows: [],
  focusedWindowId: undefined,
  startMenuOpen: false,
  theme: "dark",
  wallpaperId: 0,
  accentColor: "#4f9cf7",
  cursorSize: "small",
  desktopItems: baseDesktopItems,
  widgets: [
    { id: createId("widget"), type: "clock", x: 40, y: 40 },
    { id: createId("widget"), type: "weather", x: 40, y: 160 },
  ],
  fs: initialFs,
  setBooting: (booting) => set({ booting }),
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
    }));
  },
  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((win) => win.id !== id),
      focusedWindowId:
        state.focusedWindowId === id ? undefined : state.focusedWindowId,
    })),
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
      focusedWindowId:
        state.focusedWindowId === id ? undefined : state.focusedWindowId,
    })),
  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((win) => {
        if (win.id !== id) return win;
        if (!win.maximized) {
          return {
            ...win,
            maximized: true,
            restore: { x: win.x, y: win.y, w: win.w, h: win.h },
          };
        }
        if (win.restore) {
          return {
            ...win,
            maximized: false,
            x: win.restore.x,
            y: win.restore.y,
            w: win.restore.w,
            h: win.restore.h,
            restore: undefined,
          };
        }
        return { ...win, maximized: false };
      }),
    })),
  moveWindow: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id ? { ...win, x, y } : win
      ),
    })),
  resizeWindow: (id, w, h) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id
          ? { ...win, w: clamp(w, 320, 1400), h: clamp(h, 240, 900) }
          : win
      ),
    })),
  setTheme: (theme) => set({ theme }),
  cycleWallpaper: () =>
    set((state) => ({
      wallpaperId: (state.wallpaperId + 1) % wallpapers.length,
    })),
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
      return {
        ...state,
        fs: makeFolder(state.fs, desktopId, finalName),
      };
    }),
  setStartMenuOpen: (open) => set({ startMenuOpen: open }),
  cycleWindows: () =>
    set((state) => {
      if (state.windows.length === 0) return state;
      const sorted = [...state.windows].sort((a, b) => b.z - a.z);
      const next = sorted[1] ?? sorted[0];
      return {
        windows: state.windows.map((win) =>
          win.id === next.id ? { ...win, z: sorted[0].z + 1 } : win
        ),
        focusedWindowId: next.id,
      };
    }),
  setAccentColor: (color) => set({ accentColor: color }),
  setCursorSize: (size) => set({ cursorSize: size }),
  fsList: (folderId) => listFolder(get().fs, folderId),
  fsMkdir: (parentId, name) =>
    set((state) => ({ fs: makeFolder(state.fs, parentId, name) })),
  fsTouch: (parentId, name, content = "") =>
    set((state) => ({ fs: makeFile(state.fs, parentId, name, content) })),
  fsRename: (id, name) => set((state) => ({ fs: renameNode(state.fs, id, name) })),
  fsDelete: (id) => set((state) => ({ fs: deleteNode(state.fs, id) })),
  fsRestore: (id) => set((state) => ({ fs: restoreNode(state.fs, id) })),
  fsEmptyRecycle: () => set((state) => ({ fs: emptyRecycleBin(state.fs) })),
  fsWrite: (id, content) => set((state) => ({ fs: writeFile(state.fs, id, content) })),
  fsResolvePath: (path, cwdId) => resolvePath(get().fs, path, cwdId),
  updateWindow: (id, data) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id ? { ...win, ...data } : win
      ),
    })),
  addWidget: (type, x, y) =>
    set((state) => ({
      widgets: [...state.widgets, { id: createId("widget"), type, x, y }],
    })),
  removeWidget: (id) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
    })),
  moveWidget: (id, x, y) =>
    set((state) => ({
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleFocusMode: (windowId, minutes = 25) =>
    set((state) => {
      const active = !state.focusMode.active;
      const time = minutes * 60;
      return {
        focusMode: {
          active,
          windowId: active ? windowId : undefined,
          timeLeft: time,
          initialTime: time,
        },
        sidebarOpen: false,
      };
    }),
  tickFocusTimer: () =>
    set((state) => {
      if (!state.focusMode.active || state.focusMode.timeLeft <= 0) return state;
      return {
        focusMode: {
          ...state.focusMode,
          timeLeft: state.focusMode.timeLeft - 1,
        },
      };
    }),
  toggleMatrix: () => set((state) => ({ matrixActive: !state.matrixActive })),
  setCoffeeBreak: (active) => set({ coffeeBreakActive: active }),
  setUpdateScreen: (active) => set({ updateActive: active }),
  setGravity: (active) => set({ gravityActive: active }),
  setPulseUi: (active) => set({ pulseUiActive: active }),
}));

export const wallpaperStyles = wallpapers;
