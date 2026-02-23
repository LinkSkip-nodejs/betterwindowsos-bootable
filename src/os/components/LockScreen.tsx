import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";

const LockScreen = () => {
  const locked = useStore((s) => s.locked);
  const lockPinHash = useStore((s) => s.lockPinHash);
  const lockPinLegacy = useStore((s) => s.lockPin);
  const hasPin = !!(lockPinHash || lockPinLegacy);
  const unlock = useStore((s) => s.unlock);
  const username = useStore((s) => s.username);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (locked) {
      setPin("");
      setError(false);
      inputRef.current?.focus();
    }
  }, [locked]);

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, [locked]);

  if (!locked) return null;

  const handleUnlock = async () => {
    if (!hasPin) {
      await unlock();
      return;
    }
    const ok = await unlock(pin);
    if (!ok) {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="text-6xl font-light mb-2">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="text-lg text-white/60 mb-12">
        {time.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          😊
        </div>
        <div className="text-lg font-medium">{username || "User"}</div>

        {hasPin ? (
          <>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="password"
                className={`bg-white/10 rounded-xl px-4 py-2 w-48 text-center outline-none text-sm ${
                  error ? "ring-2 ring-red-500 animate-[shake_0.3s_ease]" : "focus:ring-2 ring-white/30"
                }`}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
                autoFocus
              />
              <button
                className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
                onClick={handleUnlock}
              >
                →
              </button>
            </div>
            {error && (
              <div className="text-red-400 text-xs">Incorrect PIN</div>
            )}
          </>
        ) : (
          <button
            className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
            onClick={handleUnlock}
            autoFocus
          >
            Click to unlock
          </button>
        )}
      </div>

      <div className="absolute bottom-8 text-white/40 text-xs">
        Press Enter to unlock
      </div>
    </div>
  );
};

export default LockScreen;
