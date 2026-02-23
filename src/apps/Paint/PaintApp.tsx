import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

type Tool = "brush" | "eraser" | "line" | "rect" | "circle" | "fill";

const COLORS = [
  "#000000", "#ffffff", "#ff0000", "#ff6600", "#ffcc00", "#33cc33",
  "#0099ff", "#6633cc", "#ff66cc", "#996633", "#666666", "#cccccc",
];

const PaintApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getCtx = () => canvasRef.current?.getContext("2d");

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    setDrawing(true);
    lastPosRef.current = pos;

    if (tool === "fill") {
      floodFill(ctx, Math.round(pos.x), Math.round(pos.y), color);
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "circle") {
      setStartPos(pos);
      snapshotRef.current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === "brush" || tool === "eraser") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPosRef.current = pos;
    } else if ((tool === "line" || tool === "rect" || tool === "circle") && startPos && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      ctx.lineWidth = size;
      ctx.strokeStyle = color;
      ctx.lineCap = "round";

      if (tool === "line") {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === "circle") {
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        const cx = startPos.x + (pos.x - startPos.x) / 2;
        const cy = startPos.y + (pos.y - startPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
    setStartPos(null);
    snapshotRef.current = null;
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "painting.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const floodFill = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const idx = (y * w + x) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2];

    // Parse fill color
    const temp = document.createElement("canvas").getContext("2d")!;
    temp.fillStyle = fillColor;
    temp.fillRect(0, 0, 1, 1);
    const [fR, fG, fB] = temp.getImageData(0, 0, 1, 1).data;

    if (targetR === fR && targetG === fG && targetB === fB) return;

    const stack = [[x, y]];
    const match = (i: number) =>
      data[i] === targetR && data[i + 1] === targetG && data[i + 2] === targetB;

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const ci = (cy * w + cx) * 4;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h || !match(ci)) continue;
      data[ci] = fR; data[ci + 1] = fG; data[ci + 2] = fB; data[ci + 3] = 255;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  const tools: { key: Tool; icon: string; label: string }[] = [
    { key: "brush", icon: "✏️", label: "Brush" },
    { key: "eraser", icon: "🧹", label: "Eraser" },
    { key: "line", icon: "📏", label: "Line" },
    { key: "rect", icon: "⬜", label: "Rectangle" },
    { key: "circle", icon: "⭕", label: "Circle" },
    { key: "fill", icon: "🪣", label: "Fill" },
  ];

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className={`w-14 flex-shrink-0 border-r flex flex-col items-center py-2 gap-1 ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        {tools.map((t) => (
          <button
            key={t.key}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
              tool === t.key ? "bg-blue-500/20 ring-1 ring-blue-400/40" : dark ? "hover:bg-white/10" : "hover:bg-gray-200"
            }`}
            onClick={() => setTool(t.key)}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
        <div className={`my-2 w-8 h-px ${dark ? "bg-white/10" : "bg-gray-200"}`} />
        {/* Size */}
        <div className="flex flex-col items-center gap-1">
          <span className={`text-[10px] ${dark ? "text-white/40" : "text-gray-400"}`}>Size</span>
          <input
            type="range"
            min={1}
            max={20}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-10 h-1 accent-blue-400"
            style={{ writingMode: "vertical-lr", WebkitAppearance: "slider-vertical" } as any}
          />
          <span className={`text-[10px] ${dark ? "text-white/50" : "text-gray-500"}`}>{size}</span>
        </div>
        <div className={`my-2 w-8 h-px ${dark ? "bg-white/10" : "bg-gray-200"}`} />
        {/* Colors */}
        <div className="grid grid-cols-2 gap-0.5">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`w-5 h-5 rounded-sm border ${color === c ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
              style={{ backgroundColor: c, borderColor: c === "#ffffff" ? "#ccc" : c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className={`my-2 w-8 h-px ${dark ? "bg-white/10" : "bg-gray-200"}`} />
        <button className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={clearCanvas} title="Clear">🗑️</button>
        <button className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`} onClick={saveImage} title="Save">💾</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-white relative">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default PaintApp;
