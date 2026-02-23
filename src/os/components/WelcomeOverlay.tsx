import { useEffect, useState } from "react";

type Props = {
  onDismiss: () => void;
};

const tips = [
  { key: "Ctrl+Space", desc: "Open App Launcher" },
  { key: "Alt+Tab", desc: "Switch Windows" },
  { key: "Ctrl+L", desc: "Lock Screen" },
  { key: "Ctrl+W", desc: "Close Window" },
  { key: "Ctrl+Shift+R", desc: "Reset Window Layout" },
  { key: "Right-click", desc: "Context menus everywhere" },
];

const WelcomeOverlay = ({ onDismiss }: Props) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 400);
  };

  // Auto-dismiss after 8s
  useEffect(() => {
    const t = setTimeout(handleDismiss, 8000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-400 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleDismiss}
    >
      <div
        className={`glass rounded-3xl p-8 max-w-md w-full shadow-2xl transition-all duration-500 ${
          exiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{ animation: "windowOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🖥️</div>
          <h2 className="text-xl font-semibold">Welcome to BetterWindowsOS</h2>
          <p className="text-sm text-white/50 mt-1">Version 2.0 — Ready to go</p>
        </div>

        <div className="space-y-2 mb-6">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">
            Quick shortcuts
          </div>
          {tips.map((tip) => (
            <div
              key={tip.key}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5"
            >
              <span className="text-sm text-white/70">{tip.desc}</span>
              <kbd className="px-2 py-0.5 rounded-lg bg-white/10 text-xs font-mono">
                {tip.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          className="w-full py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-colors"
          onClick={handleDismiss}
        >
          Get Started
        </button>

        <div className="text-center mt-3 text-xs text-white/30">
          Click anywhere or wait to dismiss
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
