export type AppId =
  | "explorer"
  | "terminal"
  | "settings"
  | "notepad"
  | "recycle"
  | "snake"
  | "bouncy";

export const appMeta: Record<
  AppId,
  { title: string; icon: string; width: number; height: number }
> = {
  explorer: { title: "Files", icon: "📁", width: 820, height: 520 },
  terminal: { title: "Terminal", icon: "🖥️", width: 700, height: 420 },
  settings: { title: "Settings", icon: "⚙️", width: 720, height: 520 },
  notepad: { title: "Notepad", icon: "📝", width: 600, height: 500 },
  recycle: { title: "Recycle Bin", icon: "🗑️", width: 520, height: 420 },
  snake: { title: "Snake Game", icon: "🐍", width: 400, height: 500 },
  bouncy: { title: "Bouncy Ball", icon: "⚽", width: 500, height: 400 },
};
