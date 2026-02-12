import { useEffect, useState } from "react";

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-48 p-4 rounded-3xl glass shadow-glass flex flex-col items-center justify-center gap-1 select-none border border-white/10">
      <div className="text-3xl font-bold font-mono">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

export default ClockWidget;
