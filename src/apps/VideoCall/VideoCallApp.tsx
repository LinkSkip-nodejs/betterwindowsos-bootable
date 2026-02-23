import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

const VideoCallApp = () => {
  const theme = useStore((s) => s.theme);
  const username = useStore((s) => s.username);
  const dark = theme === "dark";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraOn(true);
      setError("");
    } catch {
      setError("Camera access denied or not available.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stream]);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setMicOn((p) => !p);
    }
  };

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleCall = () => {
    if (!inCall) {
      startCamera();
      setInCall(true);
    } else {
      stopCamera();
      setInCall(false);
    }
  };

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const btnClass = `px-4 py-2.5 rounded-full text-sm font-medium transition-colors`;

  return (
    <div className="flex flex-col h-full">
      {/* Video area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {cameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${dark ? "bg-white/10" : "bg-gray-700"}`}>
              {username ? username[0].toUpperCase() : "U"}
            </div>
            <span className="text-white/60 text-sm">{username || "User"}</span>
            {!inCall && (
              <span className="text-white/40 text-xs">Camera off</span>
            )}
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Participant preview (small) */}
        {inCall && (
          <div className="absolute top-3 right-3 w-32 h-24 rounded-lg bg-gray-800 flex items-center justify-center text-2xl border border-white/10 overflow-hidden">
            <div className="flex flex-col items-center">
              <span>🤖</span>
              <span className="text-[10px] text-white/50 mt-1">No one else</span>
            </div>
          </div>
        )}

        {/* Call status */}
        {inCall && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            In call &middot; waiting for participants
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`flex items-center justify-center gap-3 py-3 px-4 ${dark ? "bg-white/5" : "bg-gray-100"}`}>
        <button
          className={`${btnClass} ${micOn ? (dark ? "bg-white/10 hover:bg-white/15" : "bg-gray-200 hover:bg-gray-300") : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? "🎙️ Mic" : "🔇 Muted"}
        </button>
        <button
          className={`${btnClass} ${cameraOn ? (dark ? "bg-white/10 hover:bg-white/15" : "bg-gray-200 hover:bg-gray-300") : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
          onClick={toggleCamera}
          title={cameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {cameraOn ? "📹 Cam" : "📷 Cam Off"}
        </button>
        <button
          className={`${btnClass} ${inCall ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}`}
          onClick={handleCall}
        >
          {inCall ? "📞 End Call" : "📞 Start Call"}
        </button>
      </div>
    </div>
  );
};

export default VideoCallApp;
