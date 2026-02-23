import { useState } from "react";
import { useStore, wallpaperStyles, type FontFamily } from "../../os/state/store";
import { sounds, type SoundScheme } from "../../os/utils/sounds";

type Props = {
  windowId: string;
};

type Tab = "personalization" | "system" | "accessibility" | "security" | "about";

const tabIcons: Record<Tab, string> = {
  personalization: "🎨",
  system: "⚙️",
  accessibility: "♿",
  security: "🔒",
  about: "ℹ️",
};

const colors = ["#4f9cf7", "#22c55e", "#f97316", "#ec4899", "#eab308", "#8b5cf6"];

const fontOptions: { id: FontFamily; name: string; preview: string }[] = [
  { id: "default", name: "BWOS Default", preview: "Inter — Clean & Modern" },
  { id: "classic", name: "BWOS Classic", preview: "Segoe UI — Familiar" },
  { id: "mono", name: "BWOS Mono", preview: "JetBrains Mono — Techy" },
  { id: "rounded", name: "BWOS Rounded", preview: "Nunito — Friendly" },
];

const fontPreviewStyle: Record<FontFamily, string> = {
  default: '"Inter", system-ui, sans-serif',
  classic: '"Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  rounded: '"Nunito", system-ui, sans-serif',
};

const schemeOptions: { id: SoundScheme; name: string; icon: string; desc: string }[] = [
  { id: "default", name: "Default", icon: "🔔", desc: "Clean, modern tones" },
  { id: "retro", name: "Retro", icon: "👾", desc: "8-bit style bleeps" },
  { id: "minimal", name: "Minimal", icon: "🔕", desc: "Subtle, quiet sounds" },
  { id: "silent", name: "Silent", icon: "🤫", desc: "No sounds at all" },
];

const SettingsApp = ({ windowId: _windowId }: Props) => {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const wallpaperId = useStore((s) => s.wallpaperId);
  const cycleWallpaper = useStore((s) => s.cycleWallpaper);
  const setAccentColor = useStore((s) => s.setAccentColor);
  const accentColor = useStore((s) => s.accentColor);
  const cursorSize = useStore((s) => s.cursorSize);
  const setCursorSize = useStore((s) => s.setCursorSize);
  const fontFamily = useStore((s) => s.fontFamily);
  const setFontFamily = useStore((s) => s.setFontFamily);

  // System
  const volume = useStore((s) => s.volume);
  const setVolume = useStore((s) => s.setVolume);
  const muted = useStore((s) => s.muted);
  const toggleMute = useStore((s) => s.toggleMute);
  const soundScheme = useStore((s) => s.soundScheme);
  const setSoundScheme = useStore((s) => s.setSoundScheme);
  const dndMode = useStore((s) => s.dndMode);
  const setDndMode = useStore((s) => s.setDndMode);

  // Accessibility
  const highContrast = useStore((s) => s.highContrast);
  const setHighContrast = useStore((s) => s.setHighContrast);

  // Security
  const lockPinHash = useStore((s) => s.lockPinHash);
  const lockPinLegacy = useStore((s) => s.lockPin);
  const hasPin = !!(lockPinHash || lockPinLegacy);
  const setLockPin = useStore((s) => s.setLockPin);

  // Google
  const googleAccount = useStore((s) => s.googleAccount);
  const clearGoogleAccount = useStore((s) => s.clearGoogleAccount);

  // Recovery
  const resetConfig = useStore((s) => s.resetConfig);
  const factoryReset = useStore((s) => s.factoryReset);

  const [tab, setTab] = useState<Tab>("personalization");
  const [newPin, setNewPin] = useState("");

  return (
    <div className="h-full flex text-sm">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 p-3 space-y-1">
        {(Object.keys(tabIcons) as Tab[]).map((t) => (
          <button
            key={t}
            className={`w-full text-left px-3 py-2 rounded-xl capitalize flex items-center gap-2 transition-colors ${
              tab === t ? "bg-white/10" : "hover:bg-white/5"
            }`}
            onClick={() => setTab(t)}
          >
            <span aria-hidden="true">{tabIcons[t]}</span>
            <span>{t}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-6 overflow-auto">
        {tab === "personalization" && (
          <>
            <section>
              <div className="font-medium mb-3">Theme</div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    theme === "dark" ? "bg-white/15 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  🌙 Dark
                </button>
                <button
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    theme === "light" ? "bg-white/15 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setTheme("light")}
                >
                  ☀️ Light
                </button>
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Font</div>
              <div className="grid grid-cols-2 gap-2">
                {fontOptions.map((f) => (
                  <button
                    key={f.id}
                    className={`text-left px-4 py-3 rounded-xl transition-colors ${
                      fontFamily === f.id ? "bg-white/15 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                    }`}
                    onClick={() => setFontFamily(f.id)}
                  >
                    <div className="text-xs font-medium mb-1">{f.name}</div>
                    <div
                      className="text-[11px] text-white/50"
                      style={{ fontFamily: fontPreviewStyle[f.id] }}
                    >
                      {f.preview}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Wallpaper</div>
              <div className="flex items-center gap-3">
                <div
                  className="h-16 w-28 rounded-xl border border-white/20 bg-cover bg-center"
                  style={{ backgroundImage: wallpaperStyles[wallpaperId] }}
                />
                <button
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                  onClick={cycleWallpaper}
                >
                  Next Wallpaper
                </button>
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Cursor size</div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    cursorSize === "small" ? "bg-white/15 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setCursorSize("small")}
                >
                  Small
                </button>
                <button
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    cursorSize === "large" ? "bg-white/15 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setCursorSize("large")}
                >
                  Large
                </button>
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Accent color</div>
              <div className="flex items-center gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      accentColor === color ? "border-white scale-110" : "border-white/20"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    onClick={() => setAccentColor(color)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "system" && (
          <>
            <section>
              <div className="font-medium mb-3">Volume</div>
              <div className="flex items-center gap-3">
                <span className="text-lg">{muted ? "🔇" : "🔊"}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1"
                  title="Volume"
                />
                <span className="w-10 text-right tabular-nums">{volume}%</span>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    muted ? "bg-red-500/20 text-red-300" : "bg-white/10 hover:bg-white/15"
                  }`}
                  onClick={toggleMute}
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Sound Scheme</div>
              <div className="grid grid-cols-2 gap-2">
                {schemeOptions.map((s) => (
                  <button
                    key={s.id}
                    className={`text-left px-4 py-3 rounded-xl transition-colors ${
                      soundScheme === s.id ? "bg-white/15 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setSoundScheme(s.id);
                      sounds.notification();
                    }}
                  >
                    <div className="text-xs font-medium mb-0.5">{s.icon} {s.name}</div>
                    <div className="text-[11px] text-white/40">{s.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Notifications</div>
              <button
                className={`px-4 py-2 rounded-xl transition-colors ${
                  dndMode ? "bg-red-500/20 text-red-300" : "bg-white/10 hover:bg-white/15"
                }`}
                onClick={() => setDndMode(!dndMode)}
              >
                {dndMode ? "🔕 Do Not Disturb: ON" : "🔔 Do Not Disturb: OFF"}
              </button>
            </section>

            <section>
              <div className="font-medium mb-3">Google Account</div>
              {googleAccount ? (
                <div className="flex items-center gap-3">
                  <img
                    src={googleAccount.picture}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-xs font-medium">{googleAccount.name}</div>
                    <div className="text-[11px] text-white/40">{googleAccount.email}</div>
                  </div>
                  <button
                    className="ml-auto px-3 py-1.5 rounded-xl text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                    onClick={clearGoogleAccount}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="text-xs text-white/40">
                  No Google account linked. Sign in during setup to connect.
                </div>
              )}
            </section>

            <section>
              <div className="font-medium mb-3">Recovery</div>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                  onClick={resetConfig}
                >
                  Reset Config
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  onClick={factoryReset}
                >
                  Factory Reset
                </button>
              </div>
              <div className="text-xs text-white/30 mt-2">
                Reset Config restores default settings. Factory Reset clears all data and reloads.
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Erase & Re-setup</div>
              <p className="text-xs text-white/50 mb-3">
                Delete all user data, files, and settings, then return to the first-time setup wizard.
              </p>
              <button
                className="px-4 py-2 rounded-xl bg-red-600/30 text-red-300 hover:bg-red-600/40 transition-colors ring-1 ring-red-500/20"
                onClick={() => {
                  if (!confirm("This will erase ALL data and return to the setup screen. Continue?")) return;
                  factoryReset();
                }}
              >
                Erase Data & Return to Setup
              </button>
            </section>
          </>
        )}

        {tab === "accessibility" && (
          <>
            <section>
              <div className="font-medium mb-3">High Contrast Mode</div>
              <p className="text-xs text-white/50 mb-3">
                Increases border widths, uses high-visibility colors, and removes transparency for better readability.
              </p>
              <button
                className={`px-4 py-2 rounded-xl transition-colors ${
                  highContrast ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30" : "bg-white/10 hover:bg-white/15"
                }`}
                onClick={() => setHighContrast(!highContrast)}
              >
                {highContrast ? "High Contrast: ON" : "High Contrast: OFF"}
              </button>
            </section>

            <section>
              <div className="font-medium mb-3">Reduced Motion</div>
              <p className="text-xs text-white/50 mb-2">
                Respects your system's "prefers-reduced-motion" setting automatically. No toggle needed — animations are disabled when your OS is set to reduce motion.
              </p>
            </section>

            <section>
              <div className="font-medium mb-3">Touch & Pointer</div>
              <p className="text-xs text-white/50 mb-2">
                Touch targets are automatically enlarged on touch-capable devices. Use the cursor size option in Personalization for pointer adjustments.
              </p>
            </section>
          </>
        )}

        {tab === "security" && (
          <>
            <section>
              <div className="font-medium mb-3">Lock Screen PIN</div>
              <div className="text-xs text-white/50 mb-3">
                {hasPin ? "PIN is set. Enter a new PIN or clear it." : "No PIN set. Set a PIN to protect your lock screen."}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  className="bg-white/10 rounded-xl px-3 py-2 w-40 outline-none text-sm border border-white/5 focus:border-blue-500/50"
                  placeholder="New PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                />
                <button
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                  onClick={() => {
                    setLockPin(newPin);
                    setNewPin("");
                  }}
                >
                  Set PIN
                </button>
                {hasPin && (
                  <button
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                    onClick={() => {
                      setLockPin("");
                      setNewPin("");
                    }}
                  >
                    Clear PIN
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {tab === "about" && (
          <>
            <section>
              <div className="font-medium mb-3">System</div>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/50">Name</span>
                  <span>Better Windows Web OS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/50">Version</span>
                  <span>3.0.0</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/50">Build</span>
                  <span>26000.3000</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/50">Engine</span>
                  <span>React + Vite + Electron</span>
                </div>
              </div>
            </section>

            <section>
              <div className="font-medium mb-3">Storage Usage</div>
              {(() => {
                let used = 0;
                try {
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) used += (localStorage.getItem(key) ?? "").length * 2;
                  }
                } catch {}
                const usedKB = (used / 1024).toFixed(1);
                const usedMB = (used / (1024 * 1024)).toFixed(2);
                const maxMB = 5;
                const pct = Math.min((used / (maxMB * 1024 * 1024)) * 100, 100);
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "var(--accent-color, #4f9cf7)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/50 w-20 text-right">{usedMB} / {maxMB} MB</span>
                    </div>
                    <div className="text-xs text-white/30">{usedKB} KB used across {localStorage.length} entries</div>
                  </div>
                );
              })()}
            </section>

            <section>
              <div className="font-medium mb-3">Keyboard Shortcuts</div>
              <div className="space-y-1.5 text-xs">
                {[
                  ["Alt+F4", "Close Focused Window"],
                  ["Alt+Tab", "Switch Windows"],
                  ["Ctrl+Space", "App Launcher"],
                  ["Ctrl+L", "Lock Screen"],
                  ["Ctrl+W", "Close Window"],
                  ["Ctrl+N", "New Window (same app)"],
                  ["Ctrl+Shift+Esc", "System Monitor"],
                  ["Ctrl+Shift+R", "Reset Layout"],
                  ["Ctrl+Shift+M", "Toggle Mute"],
                  ["Ctrl+Shift+D", "Toggle DND"],
                  ["Meta (alone)", "Toggle Start Menu"],
                  ["Escape", "Dismiss Overlays"],
                  ["F2", "Rename (Explorer)"],
                  ["Delete", "Delete (Explorer)"],
                  ["Ctrl+F", "Find (Notepad)"],
                  ["Ctrl+S", "Save (Notepad)"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white/10 font-mono text-[10px]">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;
