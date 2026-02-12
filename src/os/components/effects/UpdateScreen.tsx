import { useEffect, useState } from "react";
import { useStore } from "../../state/store";

const UpdateScreen = () => {
  const updateActive = useStore((s) => s.updateActive);
  const setUpdateScreen = useStore((s) => s.setUpdateScreen);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!updateActive) return;
    const interval = setInterval(() => {
      setPercent((p) => {
        if (p >= 100) {
          setUpdateScreen(false);
          return 0;
        }
        return p + Math.floor(Math.random() * 2);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [updateActive, setUpdateScreen]);

  if (!updateActive) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#0078d7] flex flex-col items-center justify-center text-white text-center p-12">
      <button 
        className="absolute top-4 right-4 opacity-0 hover:opacity-20 transition-opacity"
        onClick={() => setUpdateScreen(false)}
      >
        ✕
      </button>
      <div className="mb-12">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-8 mx-auto" />
        <div className="text-3xl font-light mb-2">Working on updates {percent}% complete.</div>
        <div className="text-3xl font-light">Don't turn off your PC. This will take a while.</div>
      </div>
      <div className="text-xl font-light opacity-80">
        Your PC will restart several times.
      </div>
    </div>
  );
};

export default UpdateScreen;
