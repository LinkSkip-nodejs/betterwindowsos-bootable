import { lazy, Suspense, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { WindowFrame } from "./WindowFrame";
import type { SnapTarget } from "./snap";

const ExplorerApp = lazy(() => import("../../apps/Explorer/ExplorerApp"));
const TerminalApp = lazy(() => import("../../apps/Terminal/TerminalApp"));
const SettingsApp = lazy(() => import("../../apps/Settings/SettingsApp"));
const NotepadApp = lazy(() => import("../../apps/Notepad/NotepadApp"));
const RecycleBinApp = lazy(() => import("../../apps/RecycleBin/RecycleBinApp"));
const SnakeApp = lazy(() => import("../../apps/Snake/SnakeApp"));
const BouncyBallApp = lazy(() => import("../../apps/BouncyBall/BouncyBallApp"));
const BrowserApp = lazy(() => import("../../apps/Browser/BrowserApp"));
const VSCodeApp = lazy(() => import("../../apps/VSCode/VSCodeApp"));
const SystemMonitorApp = lazy(() => import("../../apps/SystemMonitor/SystemMonitorApp"));
const AIAssistantApp = lazy(() => import("../../apps/AIAssistant/AIAssistantApp"));
const ScriptStudioApp = lazy(() => import("../../apps/ScriptStudio/ScriptStudioApp"));
const MailApp = lazy(() => import("../../apps/Mail/MailApp"));
const ChatApp = lazy(() => import("../../apps/Chat/ChatApp"));
const VideoCallApp = lazy(() => import("../../apps/VideoCall/VideoCallApp"));
const MusicPlayerApp = lazy(() => import("../../apps/MusicPlayer/MusicPlayerApp"));
const VideoPlayerApp = lazy(() => import("../../apps/VideoPlayer/VideoPlayerApp"));
const PhotoViewerApp = lazy(() => import("../../apps/PhotoViewer/PhotoViewerApp"));
const PaintApp = lazy(() => import("../../apps/Paint/PaintApp"));
const CalculatorApp = lazy(() => import("../../apps/Calculator/CalculatorApp"));
const CalendarApp = lazy(() => import("../../apps/Calendar/CalendarApp"));
const ClockApp = lazy(() => import("../../apps/Clock/ClockApp"));
const FileCompressorApp = lazy(() => import("../../apps/FileCompressor/FileCompressorApp"));
const MinesweeperApp = lazy(() => import("../../apps/Minesweeper/MinesweeperApp"));
const TetrisApp = lazy(() => import("../../apps/Tetris/TetrisApp"));
const FlappyBirdApp = lazy(() => import("../../apps/FlappyBird/FlappyBirdApp"));
const FTPClientApp = lazy(() => import("../../apps/FTPClient/FTPClientApp"));
const RSSReaderApp = lazy(() => import("../../apps/RSSReader/RSSReaderApp"));

type Props = {
  bounds: DOMRect | null;
};

const AppLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="loading-spinner" />
  </div>
);

const appContent = (appId: string, windowId: string) => {
  const inner = (() => {
    switch (appId) {
      case "explorer":
        return <ExplorerApp windowId={windowId} />;
      case "terminal":
        return <TerminalApp windowId={windowId} />;
      case "settings":
        return <SettingsApp windowId={windowId} />;
      case "notepad":
        return <NotepadApp windowId={windowId} />;
      case "recycle":
        return <RecycleBinApp windowId={windowId} />;
      case "snake":
        return <SnakeApp />;
      case "bouncy":
        return <BouncyBallApp />;
      case "browser":
        return <BrowserApp windowId={windowId} />;
      case "vscode":
        return <VSCodeApp windowId={windowId} />;
      case "sysmonitor":
        return <SystemMonitorApp windowId={windowId} />;
      case "aiassistant":
        return <AIAssistantApp />;
      case "scriptstudio":
        return <ScriptStudioApp />;
      case "mail":
        return <MailApp />;
      case "chat":
        return <ChatApp />;
      case "videocall":
        return <VideoCallApp />;
      case "musicplayer":
        return <MusicPlayerApp />;
      case "videoplayer":
        return <VideoPlayerApp />;
      case "photoviewer":
        return <PhotoViewerApp />;
      case "paint":
        return <PaintApp />;
      case "calculator":
        return <CalculatorApp />;
      case "calendar":
        return <CalendarApp />;
      case "clock":
        return <ClockApp />;
      case "filecompressor":
        return <FileCompressorApp />;
      case "minesweeper":
        return <MinesweeperApp />;
      case "tetris":
        return <TetrisApp />;
      case "flappybird":
        return <FlappyBirdApp />;
      case "ftpclient":
        return <FTPClientApp />;
      case "rssreader":
        return <RSSReaderApp />;
      default:
        return <div className="p-4 text-sm">App not found.</div>;
    }
  })();
  return <Suspense fallback={<AppLoading />}>{inner}</Suspense>;
};

const TaskbarPreview = ({ snap }: { snap: SnapTarget }) => {
  if (!snap) return null;
  return (
    <div
      className="absolute snap-preview rounded-xl pointer-events-none"
      style={{
        left: snap.x,
        top: snap.y,
        width: snap.w,
        height: snap.h,
        zIndex: 5,
      }}
    />
  );
};

const WindowManager = ({ bounds }: Props) => {
  const windows = useStore((s) => s.windows);
  const focusedId = useStore((s) => s.focusedWindowId);
  const theme = useStore((s) => s.theme);
  const muted = useStore((s) => s.muted);
  const focusWindow = useStore((s) => s.focusWindow);
  const closeWindow = useStore((s) => s.closeWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);
  const toggleMaximize = useStore((s) => s.toggleMaximize);
  const moveWindow = useStore((s) => s.moveWindow);
  const resizeWindow = useStore((s) => s.resizeWindow);
  const updateWindow = useStore((s) => s.updateWindow);
  const [snapPreview, setSnapPreview] = useState<SnapTarget>(null);

  const sorted = useMemo(
    () => [...windows].sort((a, b) => a.z - b.z),
    [windows]
  );

  const focusMode = useStore((s) => s.focusMode);

  return (
    <>
      <TaskbarPreview snap={snapPreview} />
      {sorted.map((win) => {
        const isFocusTarget = focusMode.active && focusMode.windowId === win.id;
        
        // Skip rendering other windows in focus mode if they aren't the focused one
        if (focusMode.active && focusMode.windowId && win.id !== focusMode.windowId) {
          return null;
        }
        
        return (
          <WindowFrame
            key={win.id}
            win={win}
            bounds={bounds}
            isFocused={focusedId === win.id}
            isFocusTarget={isFocusTarget}
            theme={theme}
            muted={muted}
            onFocus={() => focusWindow(win.id)}
            onMove={(x, y) => moveWindow(win.id, x, y)}
            onResize={(x, y, w, h) => {
              moveWindow(win.id, x, y);
              resizeWindow(win.id, w, h);
            }}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onToggleMaximize={() => toggleMaximize(win.id)}
            onSnapPreview={(snap) => setSnapPreview(snap)}
            onSnapCommit={(snap) => {
              if (snap) {
                if (snap.type === "top") {
                  updateWindow(win.id, {
                    maximized: true,
                    restore: win.maximized
                      ? win.restore
                      : { x: win.x, y: win.y, w: win.w, h: win.h },
                  });
                } else {
                  updateWindow(win.id, { maximized: false, restore: undefined });
                }
                moveWindow(win.id, snap.x, snap.y);
                resizeWindow(win.id, snap.w, snap.h);
              }
            }}
          >
            <div className="h-full">
              <div className="h-full">{appContent(win.appId, win.id)}</div>
            </div>
          </WindowFrame>
        );
      })}
    </>
  );
};

export default WindowManager;
