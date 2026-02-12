import { useEffect, useRef } from "react";
import { useStore } from "../../state/store";

const MatrixEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixActive = useStore((s) => s.matrixActive);

  useEffect(() => {
    if (!matrixActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, [matrixActive]);

  if (!matrixActive) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[100] pointer-events-none opacity-80"
      />
      <button 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[101] px-4 py-2 bg-black/50 border border-green-500/30 text-green-500 text-xs rounded-full hover:bg-black transition-colors pointer-events-auto font-mono"
        onClick={() => useStore.getState().toggleMatrix()}
      >
        EXIT_MATRIX
      </button>
    </>
  );
};

export default MatrixEffect;
