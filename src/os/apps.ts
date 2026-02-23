export type AppId =
  | "explorer"
  | "terminal"
  | "settings"
  | "notepad"
  | "recycle"
  | "snake"
  | "bouncy"
  | "browser"
  | "vscode"
  | "sysmonitor"
  | "aiassistant"
  | "scriptstudio"
  | "mail"
  | "chat"
  | "videocall"
  | "musicplayer"
  | "videoplayer"
  | "photoviewer"
  | "paint"
  | "calculator"
  | "calendar"
  | "clock"
  | "filecompressor"
  | "minesweeper"
  | "tetris"
  | "flappybird"
  | "ftpclient"
  | "rssreader";

/** Map file extensions to the app that should open them */
export const fileAssociations: Record<string, AppId> = {
  ".txt": "notepad",
  ".md": "notepad",
  ".log": "notepad",
  ".json": "notepad",
  ".js": "notepad",
  ".ts": "notepad",
  ".html": "notepad",
  ".css": "notepad",
  ".png": "photoviewer",
  ".jpg": "photoviewer",
  ".jpeg": "photoviewer",
  ".gif": "photoviewer",
  ".webp": "photoviewer",
  ".svg": "photoviewer",
  ".bmp": "photoviewer",
  ".mp3": "musicplayer",
  ".wav": "musicplayer",
  ".ogg": "musicplayer",
  ".flac": "musicplayer",
  ".mp4": "videoplayer",
  ".webm": "videoplayer",
  ".mkv": "videoplayer",
  ".avi": "videoplayer",
};

export const getAppForFile = (fileName: string): AppId => {
  const ext = fileName.lastIndexOf(".") >= 0
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";
  return fileAssociations[ext] ?? "notepad";
};

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
  browser: { title: "Browser", icon: "🌐", width: 960, height: 600 },
  vscode: { title: "VS Code", icon: "💻", width: 1000, height: 650 },
  sysmonitor: { title: "System Monitor", icon: "📊", width: 750, height: 500 },
  aiassistant: { title: "AI Assistant", icon: "🤖", width: 700, height: 550 },
  scriptstudio: { title: "Script Studio", icon: "🧪", width: 960, height: 600 },
  mail: { title: "Mail", icon: "📧", width: 800, height: 550 },
  chat: { title: "Chat", icon: "💬", width: 700, height: 550 },
  videocall: { title: "Video Call", icon: "📹", width: 800, height: 600 },
  musicplayer: { title: "Music Player", icon: "🎵", width: 600, height: 450 },
  videoplayer: { title: "Video Player", icon: "🎬", width: 800, height: 500 },
  photoviewer: { title: "Photo Viewer", icon: "🖼️", width: 800, height: 600 },
  paint: { title: "Paint", icon: "🎨", width: 900, height: 600 },
  calculator: { title: "Calculator", icon: "🧮", width: 320, height: 480 },
  calendar: { title: "Calendar", icon: "📅", width: 600, height: 500 },
  clock: { title: "Clock", icon: "⏰", width: 400, height: 450 },
  filecompressor: { title: "File Compressor", icon: "🗜️", width: 500, height: 400 },
  minesweeper: { title: "Minesweeper", icon: "💣", width: 420, height: 500 },
  tetris: { title: "Tetris", icon: "🟦", width: 380, height: 560 },
  flappybird: { title: "Flappy Bird", icon: "🐦", width: 400, height: 550 },
  ftpclient: { title: "FTP Client", icon: "📂", width: 750, height: 500 },
  rssreader: { title: "RSS Reader", icon: "📰", width: 700, height: 550 },
};
