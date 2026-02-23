import { useEffect, useState } from "react";
import { sounds } from "../utils/sounds";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState("Initializing kernel...");
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const sequence = [
      { text: "Loading system files...", delay: 600, progress: 15 },
      { text: "Starting Better Windows Services...", delay: 1200, progress: 35 },
      { text: "Mounting file system...", delay: 1800, progress: 55 },
      { text: "Initializing audio engine...", delay: 2400, progress: 70 },
      { text: "Loading desktop environment...", delay: 3000, progress: 85 },
      { text: "Applying user preferences...", delay: 3400, progress: 95 },
      { text: "Welcome!", delay: 3800, progress: 100 },
    ];

    sequence.forEach((step) => {
      setTimeout(() => {
        setText(step.text);
        setProgress(step.progress);
      }, step.delay);
    });

    // Play startup sound near the end
    setTimeout(() => {
      try { sounds.startup(); } catch { /* audio not ready */ }
    }, 3200);

    // Fade out then complete
    setTimeout(() => setFadeOut(true), 4000);
    const finalTimeout = setTimeout(onComplete, 4500);
    return () => clearTimeout(finalTimeout);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-mono transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="mb-2 relative">
        <div
          className="text-5xl font-bold tracking-tight"
          style={{ animation: "scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
        >
          BETTER <span className="text-blue-500">WINDOWS</span>
        </div>
        <div
          className="absolute -inset-8 rounded-full opacity-20 blur-3xl bg-blue-500 pointer-events-none"
          style={{ animation: "bootGlow 2s ease-in-out infinite" }}
        />
      </div>

      <div
        className="text-xs text-white/30 mb-8 tracking-widest uppercase"
        style={{ animation: "fadeIn 0.5s ease 0.3s both" }}
      >
        Web Operating System
      </div>

      {/* Progress bar */}
      <div
        className="w-72 h-1 bg-white/10 rounded-full overflow-hidden mb-4 boot-progress-bar"
        style={{ animation: "fadeIn 0.5s ease 0.5s both" }}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
          style={{
            width: `${progress}%`,
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Status text */}
      <div
        className="text-sm text-white/50 h-5 transition-all duration-300"
        style={{ animation: "fadeIn 0.5s ease 0.7s both" }}
      >
        {text}
      </div>

      {/* Dots animation */}
      <div className="flex items-center gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500/60"
            style={{
              animation: `pulseUi 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-12 text-xs text-white/15">
        Better Windows v3.0.0 (Build 26000.3000)
      </div>
    </div>
  );
};

export default LoadingScreen;
