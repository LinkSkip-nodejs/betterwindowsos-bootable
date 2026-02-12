import { useEffect, useState } from "react";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState("Initializing kernel...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = [
      { text: "Loading system files...", delay: 800, progress: 20 },
      { text: "Starting Better Windows Services...", delay: 1500, progress: 45 },
      { text: "Mounting file system...", delay: 2200, progress: 70 },
      { text: "Initializing UI Manager...", delay: 3000, progress: 90 },
      { text: "Welcome!", delay: 3500, progress: 100 },
    ];

    sequence.forEach((step) => {
      setTimeout(() => {
        setText(step.text);
        setProgress(step.progress);
      }, step.delay);
    });

    const finalTimeout = setTimeout(onComplete, 4000);
    return () => clearTimeout(finalTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-mono">
      <div className="mb-8 text-4xl font-bold tracking-tight">
        BETTER <span className="text-blue-500">WINDOWS</span>
      </div>
      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-sm text-white/60 animate-pulse h-4">{text}</div>
      <div className="absolute bottom-12 text-xs text-white/20">
        Better Windows v1.0.0 (Build 26000.1010)
      </div>
    </div>
  );
};

export default LoadingScreen;
