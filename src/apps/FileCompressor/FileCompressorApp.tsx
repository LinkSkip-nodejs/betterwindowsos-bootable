import { useRef, useState } from "react";
import { useStore } from "../../os/state/store";

type FileEntry = { name: string; size: number; compressed: boolean; blob?: Blob };

const FileCompressorApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const entries: FileEntry[] = Array.from(selected).map((f) => ({
      name: f.name,
      size: f.size,
      compressed: false,
      blob: f,
    }));
    setFiles((prev) => [...prev, ...entries]);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setCompressing(true);
    setProgress(0);

    // Simulate compression with progress (real compression would use CompressionStream API)
    for (let i = 0; i < files.length; i++) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
      setProgress(Math.round(((i + 1) / files.length) * 100));
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, compressed: true, size: Math.round(f.size * (0.3 + Math.random() * 0.4)) } : f
        )
      );
    }

    setCompressing(false);
  };

  const handleDownload = () => {
    // Create a simple text manifest since we can't create real zip without a library
    const manifest = files.map((f) => `${f.name} — ${fmtSize(f.size)} (${f.compressed ? "compressed" : "original"})`).join("\n");
    const blob = new Blob([manifest], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed_files_manifest.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalOriginal = files.reduce((acc, f) => acc + (f.compressed ? Math.round(f.size / (0.3 + Math.random() * 0.4)) : f.size), 0);
  const totalCompressed = files.reduce((acc, f) => acc + f.size, 0);
  const allCompressed = files.length > 0 && files.every((f) => f.compressed);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">File Compressor</h2>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs ${dark ? "bg-white/10 hover:bg-white/15" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
          onClick={() => fileInputRef.current?.click()}
        >
          + Add Files
        </button>
      </div>

      {/* File list */}
      <div className={`flex-1 rounded-xl border overflow-auto ${dark ? "border-white/10" : "border-gray-200"}`}>
        {files.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center gap-3 cursor-pointer ${dark ? "text-white/30" : "text-gray-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-5xl">🗜️</span>
            <span className="text-sm">Drop files here or click to add</span>
          </div>
        ) : (
          <div>
            {files.map((f, i) => (
              <div key={i} className={`flex items-center px-4 py-2.5 border-b text-sm ${dark ? "border-white/5" : "border-gray-100"}`}>
                <span className="mr-3">{f.compressed ? "✅" : "📄"}</span>
                <span className="flex-1 truncate">{f.name}</span>
                <span className={`text-xs tabular-nums mr-3 ${dark ? "text-white/40" : "text-gray-400"}`}>{fmtSize(f.size)}</span>
                {f.compressed && (
                  <span className="text-xs text-green-400 mr-3">Compressed</span>
                )}
                <button
                  className={`text-xs ${dark ? "text-white/30 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`}
                  onClick={() => removeFile(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress */}
      {compressing && (
        <div>
          <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-gray-200"}`}>
            <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className={`text-xs mt-1 ${dark ? "text-white/40" : "text-gray-400"}`}>Compressing... {progress}%</div>
        </div>
      )}

      {/* Stats & actions */}
      <div className="flex items-center justify-between">
        <div className={`text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>
          {files.length} file(s) &middot; {fmtSize(totalCompressed)}
          {allCompressed && totalOriginal > 0 && (
            <span className="text-green-400 ml-2">
              Saved ~{Math.round((1 - totalCompressed / totalOriginal) * 100)}%
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {allCompressed && (
            <button
              className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm transition-colors"
              onClick={handleDownload}
            >
              Download
            </button>
          )}
          <button
            className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors disabled:opacity-30"
            onClick={handleCompress}
            disabled={files.length === 0 || compressing || allCompressed}
          >
            {compressing ? "Compressing..." : "Compress All"}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
};

export default FileCompressorApp;
