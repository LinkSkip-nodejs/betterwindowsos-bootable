import { useEffect } from "react";
import { useStore } from "../state/store";

const FocusOverlay = () => {
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const tickFocusTimer = useStore((s) => s.tickFocusTimer);

  useEffect(() => {
    if (!focusMode.active) return;
    const interval = setInterval(tickFocusTimer, 1000);
    return () => clearInterval(interval);
  }, [focusMode.active, tickFocusTimer]);

  if (!focusMode.active) return null;

  const minutes = Math.floor(focusMode.timeLeft / 60);
  const seconds = focusMode.timeLeft % 60;
  const progress = (focusMode.timeLeft / focusMode.initialTime) * 100;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Darkening background */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-1000" />
      
      {/* Relaxing animation */}
      <div className="absolute inset-0 focus-bg-animation" />

      {/* Waves */}
      <div className="waves-container">
        <div className="wave" />
        <div className="wave wave2" />
      </div>

      {/* Focus Timer UI */}
      <div className="absolute top-6 right-6 pointer-events-auto">
        <div className="glass p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-white/10 w-48">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">Focusing</div>
          <div className="text-4xl font-mono font-bold tracking-tighter">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button 
            className="mt-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            onClick={() => toggleFocusMode()}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Exit instruction */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-widest uppercase">
        Locked to focus window
      </div>
    </div>
  );
};

export default FocusOverlay;
