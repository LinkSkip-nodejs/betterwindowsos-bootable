import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

const W = 360;
const H = 500;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 50;
const GAP = 130;
const GRAVITY = 0.45;
const JUMP = -7;
const PIPE_SPEED = 2.5;

type Pipe = { x: number; topH: number };

const FlappyBirdApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    birdY: H / 2,
    birdVel: 0,
    pipes: [] as Pipe[],
    score: 0,
    frame: 0,
    running: false,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    // Background
    ctx.fillStyle = dark ? "#0f172a" : "#87ceeb";
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = dark ? "#1e293b" : "#8B4513";
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = dark ? "#334155" : "#22a522";
    ctx.fillRect(0, H - 40, W, 8);

    // Pipes
    ctx.fillStyle = dark ? "#22c55e" : "#2d8a2d";
    for (const pipe of s.pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topH);
      ctx.fillStyle = dark ? "#16a34a" : "#1e6b1e";
      ctx.fillRect(pipe.x - 3, pipe.topH - 20, PIPE_WIDTH + 6, 20);
      ctx.fillStyle = dark ? "#22c55e" : "#2d8a2d";
      // Bottom pipe
      const bottomY = pipe.topH + GAP;
      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, H - bottomY - 40);
      ctx.fillStyle = dark ? "#16a34a" : "#1e6b1e";
      ctx.fillRect(pipe.x - 3, bottomY, PIPE_WIDTH + 6, 20);
      ctx.fillStyle = dark ? "#22c55e" : "#2d8a2d";
    }

    // Bird
    const birdX = 80;
    const angle = Math.min(Math.max(s.birdVel * 3, -30), 60);
    ctx.save();
    ctx.translate(birdX + BIRD_SIZE / 2, s.birdY + BIRD_SIZE / 2);
    ctx.rotate((angle * Math.PI) / 180);
    // Body
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(-4, 2, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, 2);
    ctx.lineTo(10, 5);
    ctx.fill();
    ctx.restore();

    // Score
    ctx.fillStyle = "white";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 3;
    ctx.strokeText(String(s.score), W / 2, 50);
    ctx.fillText(String(s.score), W / 2, 50);
  }, [dark]);

  const gameLoop = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;

    s.birdVel += GRAVITY;
    s.birdY += s.birdVel;
    s.frame++;

    // Spawn pipes
    if (s.frame % 90 === 0) {
      const topH = 60 + Math.random() * (H - GAP - 140);
      s.pipes.push({ x: W, topH });
    }

    // Move pipes
    const birdX = 80;
    for (const pipe of s.pipes) {
      pipe.x -= PIPE_SPEED;
      // Score when passing
      if (pipe.x + PIPE_WIDTH === birdX) {
        s.score++;
        setScore(s.score);
      }
    }
    s.pipes = s.pipes.filter((p) => p.x + PIPE_WIDTH > -10);

    // Collision detection
    const birdTop = s.birdY;
    const birdBottom = s.birdY + BIRD_SIZE;
    const birdLeft = birdX;
    const birdRight = birdX + BIRD_SIZE;

    // Ground/ceiling
    if (birdBottom >= H - 40 || birdTop <= 0) {
      s.running = false;
      setGameOver(true);
      setPlaying(false);
      setBest((b) => Math.max(b, s.score));
      draw();
      return;
    }

    // Pipes
    for (const pipe of s.pipes) {
      if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
        if (birdTop < pipe.topH || birdBottom > pipe.topH + GAP) {
          s.running = false;
          setGameOver(true);
          setPlaying(false);
          setBest((b) => Math.max(b, s.score));
          draw();
          return;
        }
      }
    }

    draw();
    requestAnimationFrame(gameLoop);
  }, [draw]);

  const jump = useCallback(() => {
    if (!stateRef.current.running) return;
    stateRef.current.birdVel = JUMP;
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = {
      birdY: H / 2,
      birdVel: 0,
      pipes: [],
      score: 0,
      frame: 0,
      running: true,
    };
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // Initial draw
  useEffect(() => { draw(); }, [draw]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        if (!playing && !stateRef.current.running) startGame();
        else jump();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, jump, startGame]);

  return (
    <div className="flex flex-col h-full items-center justify-center gap-3"
      style={{ background: dark ? "#0f172a" : "#87ceeb" }}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-lg border border-white/10 cursor-pointer"
          onClick={() => { if (!playing) startGame(); else jump(); }}
        />

        {!playing && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg">
            <div className="text-4xl mb-2">🐦</div>
            <div className="text-white text-lg font-bold">Flappy Bird</div>
            <div className="text-white/60 text-sm mt-1">Click or press Space to start</div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg">
            <div className="text-white text-xl font-bold mb-1">Game Over!</div>
            <div className="text-white/80 text-sm">Score: {score}</div>
            <div className="text-white/60 text-xs">Best: {best}</div>
            <button
              className="mt-3 px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm transition-colors"
              onClick={startGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlappyBirdApp;
