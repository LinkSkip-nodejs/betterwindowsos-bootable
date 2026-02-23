import { useRef, useState } from "react";
import { useStore } from "../../os/state/store";

const PhotoViewerApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      if (images.length === 0) setCurrentIdx(0);
    }
  };

  const current = images[currentIdx];

  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs ${dark ? "bg-white/10 hover:bg-white/15" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
          onClick={() => fileInputRef.current?.click()}
        >
          📂 Open Images
        </button>
        <div className="flex-1" />
        {current && (
          <>
            <button className={`px-2 py-1 rounded text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>-</button>
            <span className={`text-xs tabular-nums w-12 text-center ${dark ? "text-white/50" : "text-gray-500"}`}>{Math.round(zoom * 100)}%</span>
            <button className={`px-2 py-1 rounded text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button>
            <button className={`px-2 py-1 rounded text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={() => setZoom(1)}>Fit</button>
            <span className={`mx-1 ${dark ? "text-white/20" : "text-gray-300"}`}>|</span>
            <button className={`px-2 py-1 rounded text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={() => setRotation((r) => (r - 90) % 360)}>↶</button>
            <button className={`px-2 py-1 rounded text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={() => setRotation((r) => (r + 90) % 360)}>↷</button>
          </>
        )}
      </div>

      {/* Main view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image area */}
        <div className="flex-1 flex items-center justify-center overflow-auto bg-black/50 relative">
          {current ? (
            <>
              <img
                src={current.url}
                alt={current.name}
                className="max-w-none transition-transform duration-200"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                draggable={false}
              />
              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg transition-colors"
                    onClick={() => goTo((currentIdx - 1 + images.length) % images.length)}
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg transition-colors"
                    onClick={() => goTo((currentIdx + 1) % images.length)}
                  >
                    ›
                  </button>
                </>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
                {current.name} &middot; {currentIdx + 1}/{images.length}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <span className="text-6xl">🖼️</span>
              <span className="text-sm">No images loaded</span>
              <button
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                Open Images
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className={`w-20 border-l overflow-auto flex flex-col gap-1 p-1 ${dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
            {images.map((img, i) => (
              <button
                key={i}
                className={`w-full aspect-square rounded overflow-hidden border-2 transition-colors ${
                  i === currentIdx ? "border-blue-400" : "border-transparent hover:border-white/20"
                }`}
                onClick={() => goTo(i)}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
};

export default PhotoViewerApp;
