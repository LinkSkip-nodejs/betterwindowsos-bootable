import { useEffect, useState } from "react";
import { useStore } from "../../state/store";

const CoffeeBreak = () => {
  const coffeeBreakActive = useStore((s) => s.coffeeBreakActive);
  const setCoffeeBreak = useStore((s) => s.setCoffeeBreak);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (!coffeeBreakActive) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setCoffeeBreak(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [coffeeBreakActive, setCoffeeBreak]);

  if (!coffeeBreakActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center text-white font-mono overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop")',
          filter: 'brightness(0.3)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-5xl font-bold mb-4 uppercase tracking-[0.3em] text-amber-50/90">
          Coffee Break
        </div>
        <div className="text-8xl font-light mb-12 tabular-nums text-white/90">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <button 
          className="px-10 py-3 border border-white/30 rounded-full hover:bg-white/10 hover:border-white/60 transition-all duration-300 backdrop-blur-md uppercase tracking-widest text-sm"
          onClick={() => setCoffeeBreak(false)}
        >
          I'm back!
        </button>
      </div>
    </div>
  );
};

export default CoffeeBreak;
