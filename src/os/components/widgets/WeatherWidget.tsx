import { useEffect, useState } from "react";

const WeatherWidget = () => {
  const [temp, setTemp] = useState(22);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTemp(t => t + (Math.random() > 0.5 ? 1 : -1));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-48 p-4 rounded-3xl glass shadow-glass flex flex-col items-center justify-center gap-2 select-none border border-white/10">
      <div className="text-4xl">☀️</div>
      <div className="text-2xl font-bold">{temp}°C</div>
      <div className="text-xs text-white/60 uppercase tracking-widest">Sunny</div>
      <div className="text-[10px] text-white/40 mt-1">San Francisco, CA</div>
    </div>
  );
};

export default WeatherWidget;
