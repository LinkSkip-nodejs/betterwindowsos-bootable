import { useStore } from "../state/store";

const Sidebar = () => {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const addWidget = useStore((s) => s.addWidget);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const windows = useStore((s) => s.windows);
  const theme = useStore((s) => s.theme);

  if (!sidebarOpen) return null;

  return (
    <div className={`fixed top-0 right-0 bottom-[54px] w-80 z-40 shadow-2xl animate-[slideIn_0.2s_ease-out] ${theme === 'dark' ? 'glass' : 'glass-light'}`}>
      <div className="p-6 h-full flex flex-col gap-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Widgets & Focus</h2>
          <button 
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <section className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">Focus Mode</h3>
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-4">
            <p className="text-sm text-white/70">Select a window to lock focus and start a 25-minute chill session.</p>
            <div className="space-y-2">
              {windows.length === 0 ? (
                <div className="text-xs text-white/30 italic">No windows open to focus on.</div>
              ) : (
                windows.map(win => (
                  <button
                    key={win.id}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2 transition-colors"
                    onClick={() => toggleFocusMode(win.id, 25)}
                  >
                    <span>{win.icon}</span>
                    <span className="truncate">{win.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">Add Widgets</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'weather', icon: '☀️', label: 'Weather' },
              { type: 'clock', icon: '🕒', label: 'Clock' },
              { type: 'battery', icon: '🔋', label: 'Battery' },
            ].map(widget => (
              <button
                key={widget.type}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center gap-2 transition-all hover:scale-[1.02]"
                onClick={() => {
                  addWidget(widget.type as any, 100, 100);
                  setSidebarOpen(false);
                }}
              >
                <span className="text-2xl">{widget.icon}</span>
                <span className="text-xs font-medium">{widget.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sidebar;
