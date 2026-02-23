import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

type Track = { id: number; title: string; artist: string; duration: number; freq: number };

const playlist: Track[] = [
  { id: 1, title: "Ambient Dreams", artist: "BWOS Audio", duration: 45, freq: 440 },
  { id: 2, title: "Electric Sunrise", artist: "Synth Wave", duration: 38, freq: 523 },
  { id: 3, title: "Midnight Code", artist: "Dev Beats", duration: 52, freq: 392 },
  { id: 4, title: "Neon Lights", artist: "Retro FM", duration: 41, freq: 349 },
  { id: 5, title: "Binary Sunset", artist: "Chip Tune", duration: 36, freq: 466 },
  { id: 6, title: "Data Flow", artist: "BWOS Audio", duration: 48, freq: 587 },
];

const MusicPlayerApp = () => {
  const theme = useStore((s) => s.theme);
  const volume = useStore((s) => s.volume);
  const dark = theme === "dark";

  const [currentTrack, setCurrentTrack] = useState<Track>(playlist[0]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number>(0);

  const stopAudio = useCallback(() => {
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
      oscRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const playTrack = useCallback((track: Track) => {
    stopAudio();
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 0.15;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = track.freq;
    // Add slight vibrato for interest
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 4;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    osc.connect(gain);
    osc.start();
    oscRef.current = osc;

    setProgress(0);
    setPlaying(true);
    setCurrentTrack(track);

    intervalRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= track.duration) {
          return track.duration;
        }
        return p + 1;
      });
    }, 1000);
  }, [volume, stopAudio]);

  // Handle track end
  useEffect(() => {
    if (progress >= currentTrack.duration && playing) {
      stopAudio();
      setPlaying(false);
      if (repeat) {
        setTimeout(() => playTrack(currentTrack), 300);
      } else {
        handleNext();
      }
    }
  }, [progress, currentTrack.duration, playing]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = (volume / 100) * 0.15;
  }, [volume]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const handlePlayPause = () => {
    if (playing) {
      stopAudio();
      setPlaying(false);
    } else {
      playTrack(currentTrack);
    }
  };

  const handleNext = () => {
    const idx = playlist.findIndex((t) => t.id === currentTrack.id);
    const next = shuffle
      ? playlist[Math.floor(Math.random() * playlist.length)]
      : playlist[(idx + 1) % playlist.length];
    stopAudio();
    setPlaying(false);
    setCurrentTrack(next);
    setProgress(0);
  };

  const handlePrev = () => {
    const idx = playlist.findIndex((t) => t.id === currentTrack.id);
    const prev = playlist[(idx - 1 + playlist.length) % playlist.length];
    stopAudio();
    setPlaying(false);
    setCurrentTrack(prev);
    setProgress(0);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full">
      {/* Album art area */}
      <div className={`flex-1 flex flex-col items-center justify-center gap-4 p-6 ${dark ? "bg-gradient-to-b from-blue-900/20 to-transparent" : "bg-gradient-to-b from-blue-100 to-white"}`}>
        <div
          className={`w-36 h-36 rounded-2xl flex items-center justify-center text-6xl shadow-lg ${dark ? "bg-white/10" : "bg-gray-100"} ${playing ? "animate-pulse" : ""}`}
        >
          🎵
        </div>
        <div className="text-center">
          <div className="text-lg font-medium">{currentTrack.title}</div>
          <div className={`text-sm ${dark ? "text-white/50" : "text-gray-500"}`}>{currentTrack.artist}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-2">
        <div className={`h-1 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-gray-200"}`}>
          <div
            className="h-full bg-blue-400 transition-all duration-1000 ease-linear"
            style={{ width: `${(progress / currentTrack.duration) * 100}%` }}
          />
        </div>
        <div className={`flex justify-between text-xs mt-1 ${dark ? "text-white/40" : "text-gray-400"}`}>
          <span>{fmt(progress)}</span>
          <span>{fmt(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={`flex items-center justify-center gap-4 py-4 px-6 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${shuffle ? "text-blue-400" : dark ? "text-white/40" : "text-gray-400"} hover:scale-110 transition-transform`}
          onClick={() => setShuffle((s) => !s)}
          title="Shuffle"
        >
          🔀
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform" onClick={handlePrev}>⏮</button>
        <button
          className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl hover:bg-blue-600 transition-colors shadow-lg"
          onClick={handlePlayPause}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform" onClick={handleNext}>⏭</button>
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${repeat ? "text-blue-400" : dark ? "text-white/40" : "text-gray-400"} hover:scale-110 transition-transform`}
          onClick={() => setRepeat((r) => !r)}
          title="Repeat"
        >
          🔁
        </button>
      </div>

      {/* Playlist */}
      <div className={`border-t overflow-auto max-h-40 ${dark ? "border-white/10" : "border-gray-200"}`}>
        {playlist.map((track) => (
          <button
            key={track.id}
            className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition-colors ${
              currentTrack.id === track.id
                ? dark ? "bg-white/10" : "bg-blue-50"
                : dark ? "hover:bg-white/5" : "hover:bg-gray-50"
            }`}
            onClick={() => { setCurrentTrack(track); setProgress(0); stopAudio(); setPlaying(false); }}
          >
            <div className="flex items-center gap-2">
              {currentTrack.id === track.id && playing && <span className="text-blue-400 text-xs">♪</span>}
              <span>{track.title}</span>
              <span className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>&middot; {track.artist}</span>
            </div>
            <span className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>{fmt(track.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MusicPlayerApp;
