import { useEffect, useRef, useState } from "react";
import { useStore, type WifiNetwork } from "../state/store";
import { sounds } from "../utils/sounds";

type Step = "welcome" | "wifi" | "google" | "account" | "done";

const GOOGLE_CLIENT_ID = "849096066704-i81ovec99gufigrn8dr2sqgn797angae.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost/oauth2callback";

const GOOGLE_AUTH_URL =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=${encodeURIComponent("openid email profile")}` +
  `&prompt=consent`;

const isElectron = !!window.electronAPI?.isElectron;

const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedWifi, setSelectedWifi] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [wifiConnected, setWifiConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleLinked, setGoogleLinked] = useState(false);
  const [showWebview, setShowWebview] = useState(false);
  const webviewRef = useRef<any>(null);

  const wifiNetworks = useStore((s) => s.wifiNetworks);
  const muted = useStore((s) => s.muted);
  const completeSetup = useStore((s) => s.completeSetup);
  const scanWifi = useStore((s) => s.scanWifi);
  const setGoogleAccount = useStore((s) => s.setGoogleAccount);

  // Scan WiFi when entering the wifi step
  useEffect(() => {
    if (step === "wifi") {
      handleScan();
    }
  }, [step]);

  const handleScan = async () => {
    setScanning(true);
    await scanWifi();
    setScanning(false);
  };

  const handleTokenFromUrl = async (url: string) => {
    // Extract access_token from the URL hash fragment
    const hashParams = new URLSearchParams(url.split("#")[1] || "");
    const accessToken = hashParams.get("access_token");

    if (!accessToken) {
      setGoogleLoading(false);
      setShowWebview(false);
      setGoogleError("Sign-in was cancelled or failed. Try again.");
      return;
    }

    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const info = await res.json();

      setGoogleAccount({
        email: info.email,
        name: info.name,
        picture: info.picture,
        accessToken,
      });

      setGoogleLinked(true);
      setUsername(info.name?.split(" ")[0] || info.email.split("@")[0]);
      if (!muted) sounds.notification();
    } catch {
      setGoogleError("Failed to fetch account info. Try again.");
    } finally {
      setGoogleLoading(false);
      setShowWebview(false);
    }
  };

  // Listen for OAuth callback from main process (intercepts redirect before ERR_CONNECTION_REFUSED)
  useEffect(() => {
    if (!isElectron || !window.electronAPI?.onOAuthCallback) return;
    window.electronAPI.onOAuthCallback((url: string) => {
      handleTokenFromUrl(url);
    });
  }, []);

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setGoogleError("");

    if (isElectron) {
      // Show embedded webview with Google's OAuth page
      setShowWebview(true);
    } else {
      // Browser fallback: use Google Identity Services popup
      if (!window.google?.accounts?.oauth2) {
        setGoogleError("Google sign-in is not available. Check your internet connection.");
        setGoogleLoading(false);
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async (response) => {
          if (response.error || !response.access_token) {
            setGoogleLoading(false);
            setGoogleError("Sign-in was cancelled or failed. Try again.");
            return;
          }
          await handleTokenFromUrl(`#access_token=${response.access_token}`);
        },
      });

      client.requestAccessToken({ prompt: "consent" });
    }
  };

  const goNext = (next: Step) => {
    if (!muted) sounds.click();
    setStep(next);
  };

  const handleConnectWifi = (network: WifiNetwork) => {
    setSelectedWifi(network.ssid);
    setConnectError("");
    setWifiPassword("");
    if (!network.secured) {
      doConnect(network.ssid);
    }
  };

  const doConnect = async (ssid: string, password?: string) => {
    setConnecting(true);
    setConnectError("");

    if (window.electronAPI?.wifi) {
      // Real connection via Electron IPC — real hardware only
      const success = await window.electronAPI.wifi.connect(ssid, password);
      setConnecting(false);
      if (success) {
        setWifiConnected(true);
        useStore.getState().connectWifi(ssid);
        if (!muted) sounds.notification();
      } else {
        setConnectError("Connection failed. Check password and try again.");
      }
    } else {
      // No Electron WiFi API — cannot connect without real hardware
      setConnecting(false);
      setConnectError("WiFi is only available when running on real hardware.");
    }
  };

  const handleWifiPasswordSubmit = () => {
    if (wifiPassword.length < 1 || !selectedWifi) return;
    doConnect(selectedWifi, wifiPassword);
  };

  const handleFinish = () => {
    if (!username.trim()) return;
    if (pin && pin !== pinConfirm) {
      setPinError("PINs don't match");
      return;
    }
    completeSetup(username.trim(), pin, wifiConnected ? selectedWifi : null);
    if (!muted) sounds.notification();
    setStep("done");
    setTimeout(onComplete, 2000);
  };

  const signalBars = (signal: number) => {
    const bars = signal > 75 ? 4 : signal > 50 ? 3 : signal > 25 ? 2 : 1;
    return (
      <span className="inline-flex gap-[2px] items-end h-4">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-sm ${i <= bars ? "bg-white/80" : "bg-white/20"}`}
            style={{ height: `${i * 4}px` }}
          />
        ))}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(79,156,247,0.15) 0%, transparent 60%)",
        }}
      />

      <div
        className="relative w-full max-w-lg mx-4"
        style={{ animation: "windowOpen 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* ── Welcome ─────────────────────────────────────── */}
        {step === "welcome" && (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-2">🖥️</div>
            <h1 className="text-3xl font-light">Welcome to BetterWindowsOS</h1>
            <p className="text-white/50 text-sm max-w-sm mx-auto">
              Let's get you set up. This will only take a moment.
            </p>
            <button
              className="px-8 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-colors border border-blue-500/20"
              onClick={() => goNext("wifi")}
            >
              Let's go
            </button>
          </div>
        )}

        {/* ── WiFi ────────────────────────────────────────── */}
        {step === "wifi" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium">Connect to a network</h2>
                <p className="text-sm text-white/50 mt-1">
                  Choose a WiFi network to get online.
                </p>
              </div>
              <button
                className="px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <span className="loading-spinner inline-block !w-3 !h-3" />
                ) : (
                  "🔄 Scan"
                )}
              </button>
            </div>

            <div className="space-y-1 max-h-[280px] overflow-auto">
              {scanning && wifiNetworks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-white/40">
                  <div className="loading-spinner" />
                  <span className="text-sm">Scanning for networks...</span>
                </div>
              ) : wifiNetworks.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  No networks found. Click Scan to refresh.
                </div>
              ) : (
                [...wifiNetworks]
                  .sort((a, b) => b.signal - a.signal)
                  .map((network) => (
                    <button
                      key={network.ssid}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                        selectedWifi === network.ssid
                          ? "bg-blue-500/20 ring-1 ring-blue-500/30"
                          : "hover:bg-white/5"
                      }`}
                      onClick={() => handleConnectWifi(network)}
                      disabled={connecting}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">
                          {network.secured ? "🔒" : "📶"}
                        </span>
                        <div className="text-left">
                          <div>{network.ssid}</div>
                          <div className="text-xs text-white/40">
                            {network.secured ? "Secured" : "Open"}
                            {wifiConnected && selectedWifi === network.ssid && (
                              <span className="text-green-400 ml-2">Connected</span>
                            )}
                            {network.connected && selectedWifi !== network.ssid && (
                              <span className="text-green-400/60 ml-2">Current</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {signalBars(network.signal)}
                    </button>
                  ))
              )}
            </div>

            {/* Password input for secured networks */}
            {selectedWifi && !wifiConnected && (() => {
              const net = wifiNetworks.find((n) => n.ssid === selectedWifi);
              if (!net?.secured) return null;
              return (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/5 focus:border-blue-500/50"
                      placeholder={`Password for "${selectedWifi}"`}
                      value={wifiPassword}
                      onChange={(e) => {
                        setWifiPassword(e.target.value);
                        setConnectError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleWifiPasswordSubmit()}
                      disabled={connecting}
                      autoFocus
                    />
                    <button
                      className="px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors disabled:opacity-50"
                      onClick={handleWifiPasswordSubmit}
                      disabled={connecting || !wifiPassword}
                    >
                      {connecting ? (
                        <span className="loading-spinner inline-block !w-4 !h-4" />
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                  {connectError && (
                    <p className="text-xs text-red-400">{connectError}</p>
                  )}
                </div>
              );
            })()}

            {connecting && !wifiNetworks.find((n) => n.ssid === selectedWifi)?.secured && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span className="loading-spinner inline-block !w-4 !h-4" />
                Connecting to {selectedWifi}...
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:bg-white/5 transition-colors"
                onClick={() => goNext("google")}
              >
                Skip for now
              </button>
              <button
                className="px-6 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-colors disabled:opacity-30"
                onClick={() => goNext("google")}
                disabled={!wifiConnected && !!selectedWifi && connecting}
              >
                {wifiConnected ? "Continue" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* ── Google Sign-In ────────────────────────────────── */}
        {step === "google" && !showWebview && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-medium">Sign in with Google</h2>
              <p className="text-sm text-white/50 mt-1">
                Link your Google account to sync with the built-in browser and services.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              {googleLinked ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">
                    ✓
                  </div>
                  <p className="text-sm text-green-400 font-medium">Account linked successfully!</p>
                  <p className="text-xs text-white/50">
                    {useStore.getState().googleAccount?.email}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <button
                    className="px-6 py-3 rounded-xl bg-white text-gray-800 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-3 disabled:opacity-50"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <span className="loading-spinner inline-block !w-4 !h-4 !border-gray-300 !border-t-gray-600" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Sign in with Google
                  </button>
                  {googleError && (
                    <p className="text-xs text-red-400 text-center max-w-xs">{googleError}</p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:bg-white/5 transition-colors"
                onClick={() => goNext("wifi")}
              >
                Back
              </button>
              <div className="flex gap-2">
                {!googleLinked && (
                  <button
                    className="px-4 py-2 rounded-xl text-sm text-white/50 hover:bg-white/5 transition-colors"
                    onClick={() => goNext("account")}
                  >
                    Skip
                  </button>
                )}
                <button
                  className="px-6 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-colors"
                  onClick={() => goNext("account")}
                >
                  {googleLinked ? "Continue" : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Embedded Google Sign-In Webview ──────────────── */}
        {step === "google" && showWebview && (
          <div className="glass rounded-2xl overflow-hidden" style={{ width: "480px", height: "600px" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-sm text-white/60">Sign in with Google</span>
              <button
                className="text-white/40 hover:text-white/80 text-lg transition-colors"
                onClick={() => { setShowWebview(false); setGoogleLoading(false); }}
              >
                ✕
              </button>
            </div>
            {isElectron ? (
              <webview
                ref={webviewRef}
                src={GOOGLE_AUTH_URL}
                style={{ width: "100%", height: "calc(100% - 40px)", border: "none" }}
              />
            ) : (
              <iframe
                src={GOOGLE_AUTH_URL}
                style={{ width: "100%", height: "calc(100% - 40px)", border: "none" }}
                title="Google Sign-In"
              />
            )}
          </div>
        )}

        {/* ── Account ─────────────────────────────────────── */}
        {step === "account" && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-medium">Create your account</h2>
              <p className="text-sm text-white/50 mt-1">
                Choose a username and set a PIN to secure your device.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Username</label>
                <input
                  type="text"
                  className="w-full bg-white/10 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/5 focus:border-blue-500/50"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  maxLength={24}
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">
                  PIN <span className="text-white/30">(optional)</span>
                </label>
                <input
                  type="password"
                  className="w-full bg-white/10 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/5 focus:border-blue-500/50"
                  placeholder="Create a PIN"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError("");
                  }}
                  maxLength={16}
                />
              </div>

              {pin && (
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    className={`w-full bg-white/10 rounded-xl px-4 py-2.5 text-sm outline-none border ${
                      pinError
                        ? "border-red-500/50 ring-1 ring-red-500/20"
                        : "border-white/5 focus:border-blue-500/50"
                    }`}
                    placeholder="Re-enter PIN"
                    value={pinConfirm}
                    onChange={(e) => {
                      setPinConfirm(e.target.value);
                      setPinError("");
                    }}
                    maxLength={16}
                  />
                  {pinError && (
                    <p className="text-xs text-red-400 mt-1">{pinError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:bg-white/5 transition-colors"
                onClick={() => goNext("google")}
              >
                Back
              </button>
              <button
                className="px-6 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-colors disabled:opacity-30"
                onClick={handleFinish}
                disabled={!username.trim()}
              >
                Finish setup
              </button>
            </div>
          </div>
        )}

        {/* ── Done ────────────────────────────────────────── */}
        {step === "done" && (
          <div className="text-center space-y-4" style={{ animation: "scaleIn 0.4s ease" }}>
            <div className="text-5xl">✨</div>
            <h2 className="text-2xl font-light">You're all set, {username}!</h2>
            <p className="text-sm text-white/50">
              Your desktop is ready. Enjoy BetterWindowsOS.
            </p>
            <div className="loading-spinner mx-auto mt-4" />
          </div>
        )}

        {/* Step indicators */}
        {step !== "done" && (
          <div className="flex justify-center gap-2 mt-8">
            {(["welcome", "wifi", "google", "account"] as Step[]).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? "w-8 bg-blue-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
