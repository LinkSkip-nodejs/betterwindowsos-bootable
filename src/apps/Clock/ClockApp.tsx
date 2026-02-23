import { useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

type Tab = "clock" | "timer" | "stopwatch" | "alarm";

const ClockApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const [tab, setTab] = useState<Tab>("clock");
  const [now, setNow] = useState(new Date());

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<number>(0);

  // Stopwatch state
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const swRef = useRef<number>(0);

  // Alarm state
  const [alarms, setAlarms] = useState<{ id: string; time: string; enabled: boolean }[]>([]);
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Timer
  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimerLeft((t) => {
          if (t <= 1) { setTimerRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Stopwatch
  useEffect(() => {
    if (swRunning) {
      swRef.current = window.setInterval(() => setSwTime((t) => t + 10), 10);
    }
    return () => clearInterval(swRef.current);
  }, [swRunning]);

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const fmtSw = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  const addAlarm = () => {
    setAlarms((a) => [...a, { id: Date.now().toString(), time: newAlarmTime, enabled: true }]);
  };

  const tabBtn = (t: Tab, label: string) => (
    <button
      className={`flex-1 py-2 text-sm font-medium transition-colors rounded-lg ${
        tab === t ? "bg-blue-500/20 text-blue-400" : dark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"
      }`}
      onClick={() => setTab(t)}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl ${dark ? "bg-white/5" : "bg-gray-100"}`}>
        {tabBtn("clock", "⏰ Clock")}
        {tabBtn("timer", "⏲️ Timer")}
        {tabBtn("stopwatch", "⏱️ Stopwatch")}
        {tabBtn("alarm", "🔔 Alarm")}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Clock */}
        {tab === "clock" && (
          <div className="text-center">
            <div className="text-5xl font-light tabular-nums">
              {now.toLocaleTimeString()}
            </div>
            <div className={`text-sm mt-2 ${dark ? "text-white/40" : "text-gray-400"}`}>
              {now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        )}

        {/* Timer */}
        {tab === "timer" && (
          <div className="text-center space-y-4">
            <div className="text-5xl font-light tabular-nums">
              {fmtTimer(timerLeft)}
            </div>
            {!timerRunning && timerLeft === 0 && (
              <div className="flex items-center justify-center gap-2">
                <button className={`px-3 py-1 rounded-lg text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={() => setTimerMinutes((m) => Math.max(1, m - 1))}>-</button>
                <span className="text-lg tabular-nums w-16 text-center">{timerMinutes} min</span>
                <button className={`px-3 py-1 rounded-lg text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={() => setTimerMinutes((m) => m + 1)}>+</button>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              {!timerRunning ? (
                <button
                  className="px-6 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors"
                  onClick={() => { setTimerLeft(timerLeft || timerMinutes * 60); setTimerRunning(true); }}
                >
                  {timerLeft > 0 ? "Resume" : "Start"}
                </button>
              ) : (
                <button
                  className="px-6 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
                  onClick={() => setTimerRunning(false)}
                >
                  Pause
                </button>
              )}
              <button
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                onClick={() => { setTimerRunning(false); setTimerLeft(0); }}
              >
                Reset
              </button>
            </div>
            {timerLeft === 0 && timerRunning === false && timerMinutes > 0 && (
              <div className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Set time and press Start</div>
            )}
          </div>
        )}

        {/* Stopwatch */}
        {tab === "stopwatch" && (
          <div className="text-center space-y-4 w-full max-w-xs">
            <div className="text-5xl font-light tabular-nums">{fmtSw(swTime)}</div>
            <div className="flex gap-2 justify-center">
              {!swRunning ? (
                <button className="px-6 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors" onClick={() => setSwRunning(true)}>
                  {swTime > 0 ? "Resume" : "Start"}
                </button>
              ) : (
                <button className="px-6 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors" onClick={() => setSwRunning(false)}>
                  Pause
                </button>
              )}
              {swRunning && (
                <button className={`px-4 py-2 rounded-xl text-sm transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={() => setSwLaps((l) => [swTime, ...l])}>
                  Lap
                </button>
              )}
              <button className={`px-4 py-2 rounded-xl text-sm transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={() => { setSwRunning(false); setSwTime(0); setSwLaps([]); }}>
                Reset
              </button>
            </div>
            {swLaps.length > 0 && (
              <div className={`max-h-32 overflow-auto rounded-lg ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                {swLaps.map((lap, i) => (
                  <div key={i} className={`flex justify-between px-3 py-1 text-xs ${dark ? "text-white/60" : "text-gray-600"}`}>
                    <span>Lap {swLaps.length - i}</span>
                    <span className="tabular-nums">{fmtSw(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alarm */}
        {tab === "alarm" && (
          <div className="w-full max-w-xs space-y-4">
            <div className="flex gap-2">
              <input
                type="time"
                className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none ${dark ? "bg-white/10" : "bg-gray-100"}`}
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
              />
              <button className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors" onClick={addAlarm}>Add</button>
            </div>
            <div className="space-y-2">
              {alarms.length === 0 ? (
                <div className={`text-center text-sm py-8 ${dark ? "text-white/30" : "text-gray-400"}`}>No alarms set</div>
              ) : (
                alarms.map((a) => (
                  <div key={a.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <span className="text-lg tabular-nums">{a.time}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className={`w-10 h-5 rounded-full transition-colors ${a.enabled ? "bg-blue-500" : dark ? "bg-white/10" : "bg-gray-300"}`}
                        onClick={() => setAlarms((al) => al.map((x) => x.id === a.id ? { ...x, enabled: !x.enabled } : x))}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${a.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                      <button className={`text-xs ${dark ? "text-white/30 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`} onClick={() => setAlarms((al) => al.filter((x) => x.id !== a.id))}>×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockApp;
