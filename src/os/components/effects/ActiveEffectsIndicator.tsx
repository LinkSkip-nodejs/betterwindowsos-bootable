import { useStore } from "../../state/store";

const ActiveEffectsIndicator = () => {
  const gravityActive = useStore((s) => s.gravityActive);
  const pulseUiActive = useStore((s) => s.pulseUiActive);
  const setGravity = useStore((s) => s.setGravity);
  const setPulseUi = useStore((s) => s.setPulseUi);

  if (!gravityActive && !pulseUiActive) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex gap-2 pointer-events-auto">
      {gravityActive && (
        <button 
          className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white/80 transition-all backdrop-blur-md flex items-center gap-2"
          onClick={() => setGravity(false)}
        >
          <span>Gravity ON</span>
          <span className="opacity-40 hover:opacity-100">✕</span>
        </button>
      )}
      {pulseUiActive && (
        <button 
          className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white/80 transition-all backdrop-blur-md flex items-center gap-2"
          onClick={() => setPulseUi(false)}
        >
          <span>Pulse UI</span>
          <span className="opacity-40 hover:opacity-100">✕</span>
        </button>
      )}
    </div>
  );
};

export default ActiveEffectsIndicator;
