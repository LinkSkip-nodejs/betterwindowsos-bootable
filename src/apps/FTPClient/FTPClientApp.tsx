import { useState } from "react";
import { useStore } from "../../os/state/store";

type FTPEntry = { name: string; type: "file" | "dir"; size: string; modified: string };

const mockRemoteFiles: FTPEntry[] = [
  { name: "public_html", type: "dir", size: "--", modified: "2024-12-15" },
  { name: "backups", type: "dir", size: "--", modified: "2024-12-10" },
  { name: "logs", type: "dir", size: "--", modified: "2024-12-18" },
  { name: "index.html", type: "file", size: "4.2 KB", modified: "2024-12-15" },
  { name: "style.css", type: "file", size: "12.8 KB", modified: "2024-12-14" },
  { name: "app.js", type: "file", size: "45.6 KB", modified: "2024-12-13" },
  { name: "config.json", type: "file", size: "1.1 KB", modified: "2024-12-10" },
  { name: "README.md", type: "file", size: "2.3 KB", modified: "2024-11-28" },
];

const FTPClientApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const [host, setHost] = useState("");
  const [port, setPort] = useState("21");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [remotePath, setRemotePath] = useState("/");
  const [remoteFiles, setRemoteFiles] = useState<FTPEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleConnect = async () => {
    if (!host.trim()) return;
    setConnecting(true);
    addLog(`Connecting to ${host}:${port}...`);

    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1500));

    setConnected(true);
    setConnecting(false);
    setRemoteFiles(mockRemoteFiles);
    addLog(`Connected to ${host}`);
    addLog(`Logged in as ${username || "anonymous"}`);
    addLog("200 OK — Directory listing loaded");
  };

  const handleDisconnect = () => {
    addLog(`Disconnected from ${host}`);
    setConnected(false);
    setRemoteFiles([]);
    setSelectedFiles(new Set());
    setRemotePath("/");
  };

  const handleNavigate = (entry: FTPEntry) => {
    if (entry.type === "dir") {
      const newPath = remotePath === "/" ? `/${entry.name}` : `${remotePath}/${entry.name}`;
      setRemotePath(newPath);
      addLog(`CWD ${newPath}`);
      addLog("250 Directory changed");
    }
  };

  const handleGoUp = () => {
    if (remotePath === "/") return;
    const parent = remotePath.substring(0, remotePath.lastIndexOf("/")) || "/";
    setRemotePath(parent);
    addLog(`CWD ${parent}`);
  };

  const toggleSelect = (name: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleDownload = () => {
    for (const f of selectedFiles) {
      addLog(`RETR ${f} — Transfer complete`);
    }
    setSelectedFiles(new Set());
  };

  const inputCls = `px-2 py-1.5 rounded-lg text-xs outline-none ${dark ? "bg-white/10 focus:bg-white/15" : "bg-gray-100 focus:bg-gray-200"}`;

  return (
    <div className="flex flex-col h-full">
      {/* Connection bar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
        <input className={`w-40 ${inputCls}`} placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} disabled={connected} />
        <input className={`w-14 ${inputCls}`} placeholder="Port" value={port} onChange={(e) => setPort(e.target.value)} disabled={connected} />
        <input className={`w-24 ${inputCls}`} placeholder="User" value={username} onChange={(e) => setUsername(e.target.value)} disabled={connected} />
        <input className={`w-24 ${inputCls}`} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={connected} />
        {connected ? (
          <button className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors" onClick={handleDisconnect}>
            Disconnect
          </button>
        ) : (
          <button
            className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-xs transition-colors disabled:opacity-30"
            onClick={handleConnect}
            disabled={connecting || !host.trim()}
          >
            {connecting ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Remote file browser */}
        <div className="flex-1 flex flex-col">
          {/* Path bar */}
          {connected && (
            <div className={`flex items-center gap-2 px-3 py-1.5 border-b text-xs ${dark ? "border-white/10" : "border-gray-200"}`}>
              <button className={`px-2 py-0.5 rounded ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={handleGoUp}>⬆</button>
              <span className={dark ? "text-white/50" : "text-gray-500"}>{remotePath}</span>
              {selectedFiles.size > 0 && (
                <button className="ml-auto px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400" onClick={handleDownload}>
                  ⬇ Download ({selectedFiles.size})
                </button>
              )}
            </div>
          )}

          {/* File list */}
          <div className="flex-1 overflow-auto">
            {!connected ? (
              <div className={`flex flex-col items-center justify-center h-full gap-3 ${dark ? "text-white/30" : "text-gray-400"}`}>
                <span className="text-5xl">📂</span>
                <span className="text-sm">Enter server details and connect</span>
              </div>
            ) : remoteFiles.length === 0 ? (
              <div className={`p-4 text-sm ${dark ? "text-white/40" : "text-gray-400"}`}>Empty directory</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-xs ${dark ? "text-white/40 border-b border-white/10" : "text-gray-400 border-b border-gray-200"}`}>
                    <th className="text-left px-3 py-1.5 font-normal">Name</th>
                    <th className="text-right px-3 py-1.5 font-normal w-20">Size</th>
                    <th className="text-right px-3 py-1.5 font-normal w-28">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {remoteFiles.map((f) => (
                    <tr
                      key={f.name}
                      className={`cursor-pointer transition-colors ${
                        selectedFiles.has(f.name)
                          ? dark ? "bg-blue-500/10" : "bg-blue-50"
                          : dark ? "hover:bg-white/5" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSelect(f.name)}
                      onDoubleClick={() => handleNavigate(f)}
                    >
                      <td className="px-3 py-1.5">
                        <span className="mr-2">{f.type === "dir" ? "📁" : "📄"}</span>
                        {f.name}
                      </td>
                      <td className={`text-right px-3 py-1.5 ${dark ? "text-white/40" : "text-gray-400"}`}>{f.size}</td>
                      <td className={`text-right px-3 py-1.5 ${dark ? "text-white/40" : "text-gray-400"}`}>{f.modified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Log panel */}
      <div className={`h-28 border-t overflow-auto px-3 py-2 font-mono text-[11px] ${dark ? "border-white/10 bg-black/30 text-green-400/70" : "border-gray-200 bg-gray-900 text-green-400"}`}>
        {log.length === 0 ? (
          <span className="opacity-50">FTP log output...</span>
        ) : (
          log.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    </div>
  );
};

export default FTPClientApp;
