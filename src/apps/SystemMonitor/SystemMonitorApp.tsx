import { useEffect, useMemo, useState } from "react";
import { useStore, type LogEntry } from "../../os/state/store";

type Props = {
  windowId: string;
};

type Tab = "performance" | "logs" | "processes";

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const levelColor: Record<LogEntry["level"], string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-gray-400",
};

const SystemMonitorApp = ({ windowId: _windowId }: Props) => {
  const logs = useStore((s) => s.logs);
  const clearLogs = useStore((s) => s.clearLogs);
  const windows = useStore((s) => s.windows);
  const online = useStore((s) => s.online);
  const batteryLevel = useStore((s) => s.batteryLevel);
  const batteryCharging = useStore((s) => s.batteryCharging);
  const volume = useStore((s) => s.volume);
  const muted = useStore((s) => s.muted);
  const notifications = useStore((s) => s.notifications);
  const safeMode = useStore((s) => s.safeMode);
  const fs = useStore((s) => s.fs);

  const [tab, setTab] = useState<Tab>("performance");
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [logFilter, setLogFilter] = useState<LogEntry["level"] | "all">("all");

  // Simulated CPU/memory usage
  useEffect(() => {
    const tick = () => {
      const cpu = 10 + Math.random() * 30 + windows.length * 5;
      const mem = 20 + Object.keys(fs.nodes).length * 0.3 + windows.length * 8;
      setCpuHistory((prev) => [...prev.slice(-59), Math.min(cpu, 100)]);
      setMemHistory((prev) => [...prev.slice(-59), Math.min(mem, 100)]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windows.length, fs.nodes]);

  const filteredLogs = useMemo(
    () => (logFilter === "all" ? logs : logs.filter((l) => l.level === logFilter)),
    [logs, logFilter]
  );

  const nodeCount = Object.keys(fs.nodes).length;
  const recycleBinCount = fs.recycleBin.length;

  const MiniGraph = ({ data, color }: { data: number[]; color: string }) => {
    const h = 60;
    const w = 240;
    if (data.length < 2) return <div style={{ width: w, height: h }} />;
    const step = w / (data.length - 1);
    const points = data.map((v, i) => `${i * step},${h - (v / 100) * h}`).join(" ");
    return (
      <svg width={w} height={h} className="block">
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
        <polyline
          fill={color}
          fillOpacity="0.15"
          stroke="none"
          points={`0,${h} ${points} ${(data.length - 1) * step},${h}`}
        />
      </svg>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/60 text-sm">
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {(["performance", "logs", "processes"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 capitalize ${tab === t ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "performance" && (
          <div className="space-y-5">
            {/* CPU */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white/80">CPU Usage</span>
                <span className="text-cyan-400 font-mono">
                  {cpuHistory.length > 0 ? `${cpuHistory[cpuHistory.length - 1].toFixed(0)}%` : "—"}
                </span>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <MiniGraph data={cpuHistory} color="#22d3ee" />
              </div>
            </div>

            {/* Memory */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white/80">Memory Usage</span>
                <span className="text-green-400 font-mono">
                  {memHistory.length > 0 ? `${memHistory[memHistory.length - 1].toFixed(0)}%` : "—"}
                </span>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <MiniGraph data={memHistory} color="#4ade80" />
              </div>
            </div>

            {/* System info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Network</div>
                <div className={online ? "text-green-400" : "text-red-400"}>
                  {online ? "Online" : "Offline"}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Battery</div>
                <div className="text-yellow-400">
                  {batteryLevel}% {batteryCharging ? "(Charging)" : ""}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Audio</div>
                <div>{muted ? "Muted" : `${volume}%`}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Mode</div>
                <div className={safeMode ? "text-yellow-400" : "text-green-400"}>
                  {safeMode ? "Safe Mode" : "Normal"}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">FS Nodes</div>
                <div>{nodeCount}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Recycle Bin</div>
                <div>{recycleBinCount} item{recycleBinCount !== 1 ? "s" : ""}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <select
                className="bg-black/30 rounded px-2 py-1 text-xs outline-none"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as LogEntry["level"] | "all")}
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
              <span className="text-white/50 text-xs">{filteredLogs.length} entries</span>
              <button
                className="ml-auto px-2 py-1 bg-red-500/20 rounded text-xs hover:bg-red-500/30 text-red-300"
                onClick={clearLogs}
              >
                Clear
              </button>
            </div>
            <div className="space-y-0.5 font-mono text-xs max-h-[400px] overflow-auto">
              {filteredLogs.length === 0 && (
                <div className="text-white/40 py-4 text-center">No log entries</div>
              )}
              {filteredLogs.map((entry) => (
                <div key={entry.id} className="flex gap-2 px-2 py-0.5 hover:bg-white/5 rounded">
                  <span className="text-white/40 shrink-0">{formatTime(entry.timestamp)}</span>
                  <span className={`shrink-0 w-12 uppercase ${levelColor[entry.level]}`}>
                    {entry.level}
                  </span>
                  <span className="text-white/50 shrink-0 w-16 truncate">[{entry.source}]</span>
                  <span className="text-white/80">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "processes" && (
          <div className="space-y-2">
            <div className="text-xs text-white/50 mb-2">
              {windows.length} window{windows.length !== 1 ? "s" : ""} open &middot;{" "}
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_80px_80px_60px] gap-2 px-2 py-1 text-xs text-white/50 border-b border-white/10">
                <span>Window</span>
                <span>App</span>
                <span>Status</span>
                <span>Z</span>
              </div>
              {windows.length === 0 && (
                <div className="text-white/40 py-4 text-center text-xs">No windows open</div>
              )}
              {[...windows]
                .sort((a, b) => b.z - a.z)
                .map((win) => (
                  <div
                    key={win.id}
                    className="grid grid-cols-[1fr_80px_80px_60px] gap-2 px-2 py-1 text-xs hover:bg-white/5 rounded"
                  >
                    <span className="truncate">
                      {win.icon} {win.title}
                    </span>
                    <span className="text-white/60">{win.appId}</span>
                    <span className="text-white/60">
                      {win.minimized ? "Minimized" : win.maximized ? "Maximized" : "Normal"}
                    </span>
                    <span className="text-white/40">{win.z}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitorApp;
