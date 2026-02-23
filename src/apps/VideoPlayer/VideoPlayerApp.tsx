import { useRef, useState } from "react";
import { useStore } from "../../os/state/store";

const VideoPlayerApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fileName, setFileName] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setFileName(file.name);
    setPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Video area */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="max-w-full max-h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setPlaying(false)}
            onClick={togglePlay}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/50">
            <span className="text-6xl">🎬</span>
            <span className="text-sm">No video loaded</span>
            <button
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors text-white/80"
              onClick={() => fileInputRef.current?.click()}
            >
              Open Video File
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`px-4 py-3 space-y-2 ${dark ? "bg-white/5" : "bg-gray-100"}`}>
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 accent-blue-400"
          disabled={!videoSrc}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
              onClick={togglePlay}
              disabled={!videoSrc}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <span className={`text-xs tabular-nums ${dark ? "text-white/50" : "text-gray-500"}`}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">🔈</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-blue-400"
            />
            <button
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              📂 Open
            </button>
          </div>
        </div>
        {fileName && (
          <div className={`text-xs truncate ${dark ? "text-white/30" : "text-gray-400"}`}>{fileName}</div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

export default VideoPlayerApp;
