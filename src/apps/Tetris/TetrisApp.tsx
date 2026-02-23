import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

const COLS = 10;
const ROWS = 20;
const CELL = 24;

const PIECES = [
  { shape: [[1, 1, 1, 1]], color: "#06b6d4" }, // I
  { shape: [[1, 1], [1, 1]], color: "#eab308" }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: "#a855f7" }, // T
  { shape: [[1, 0], [1, 0], [1, 1]], color: "#f97316" }, // L
  { shape: [[0, 1], [0, 1], [1, 1]], color: "#3b82f6" }, // J
  { shape: [[0, 1, 1], [1, 1, 0]], color: "#22c55e" }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: "#ef4444" }, // Z
];

type Piece = { shape: number[][]; color: string; x: number; y: number };

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(""));

const TetrisApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";

  const [board, setBoard] = useState(emptyBoard);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);

  const pieceRef = useRef<Piece | null>(null);
  const boardRef = useRef(board);
  const intervalRef = useRef<number>(0);
  boardRef.current = board;

  const randomPiece = useCallback((): Piece => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { shape: p.shape.map((r) => [...r]), color: p.color, x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 };
  }, []);

  const collides = useCallback((b: string[][], p: Piece, dx: number, dy: number): boolean => {
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const nr = p.y + r + dy;
        const nc = p.x + c + dx;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return true;
        if (b[nr][nc]) return true;
      }
    }
    return false;
  }, []);

  const lock = useCallback((b: string[][], p: Piece): string[][] => {
    const nb = b.map((r) => [...r]);
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) {
          const nr = p.y + r;
          const nc = p.x + c;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) nb[nr][nc] = p.color;
        }
      }
    }
    return nb;
  }, []);

  const clearLines = useCallback((b: string[][]): { board: string[][]; cleared: number } => {
    const kept = b.filter((row) => row.some((c) => !c));
    const cleared = ROWS - kept.length;
    while (kept.length < ROWS) kept.unshift(Array(COLS).fill(""));
    return { board: kept, cleared };
  }, []);

  const rotate = useCallback((shape: number[][]): number[][] => {
    const rows = shape.length, cols = shape[0].length;
    const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = shape[r][c];
      }
    }
    return rotated;
  }, []);

  const tick = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    if (!collides(boardRef.current, p, 0, 1)) {
      pieceRef.current = { ...p, y: p.y + 1 };
      setBoard([...boardRef.current]); // trigger re-render
    } else {
      const locked = lock(boardRef.current, p);
      const { board: cleared, cleared: n } = clearLines(locked);
      boardRef.current = cleared;
      setBoard(cleared);
      if (n > 0) {
        const pts = [0, 100, 300, 500, 800][n] || 800;
        setScore((s) => s + pts);
        setLines((l) => {
          const newL = l + n;
          setLevel(Math.floor(newL / 10) + 1);
          return newL;
        });
      }
      const next = randomPiece();
      if (collides(cleared, next, 0, 0)) {
        setGameOver(true);
        setPlaying(false);
        clearInterval(intervalRef.current);
        pieceRef.current = null;
      } else {
        pieceRef.current = next;
      }
    }
  }, [collides, lock, clearLines, randomPiece]);

  const startGame = () => {
    const b = emptyBoard();
    boardRef.current = b;
    setBoard(b);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
    setPlaying(true);
    pieceRef.current = randomPiece();
    clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(tick, 800);
  };

  // Speed up with level
  useEffect(() => {
    if (!playing || paused) return;
    clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(tick, Math.max(100, 800 - (level - 1) * 70));
    return () => clearInterval(intervalRef.current);
  }, [level, playing, paused, tick]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!playing || gameOver) return;
      const p = pieceRef.current;
      if (!p) return;

      if (e.key === "p" || e.key === "P") {
        setPaused((v) => {
          if (!v) clearInterval(intervalRef.current);
          else intervalRef.current = window.setInterval(tick, Math.max(100, 800 - (level - 1) * 70));
          return !v;
        });
        return;
      }

      if (paused) return;

      if (e.key === "ArrowLeft" && !collides(boardRef.current, p, -1, 0)) {
        pieceRef.current = { ...p, x: p.x - 1 };
      } else if (e.key === "ArrowRight" && !collides(boardRef.current, p, 1, 0)) {
        pieceRef.current = { ...p, x: p.x + 1 };
      } else if (e.key === "ArrowDown") {
        tick();
      } else if (e.key === "ArrowUp") {
        const rotated = rotate(p.shape);
        const rp = { ...p, shape: rotated };
        if (!collides(boardRef.current, rp, 0, 0)) pieceRef.current = rp;
      } else if (e.key === " ") {
        // Hard drop
        let dy = 0;
        while (!collides(boardRef.current, p, 0, dy + 1)) dy++;
        pieceRef.current = { ...p, y: p.y + dy };
        tick();
      }
      setBoard([...boardRef.current]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, gameOver, paused, collides, rotate, tick, level]);

  // Render the board with current piece overlay
  const renderBoard = () => {
    const display = board.map((r) => [...r]);
    const p = pieceRef.current;
    if (p) {
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c]) {
            const nr = p.y + r, nc = p.x + c;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) display[nr][nc] = p.color;
          }
        }
      }
    }
    return display;
  };

  const rendered = renderBoard();

  return (
    <div className="flex h-full">
      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`border ${dark ? "border-white/20" : "border-gray-300"}`}
          style={{ width: COLS * CELL, height: ROWS * CELL }}
        >
          {rendered.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => (
                <div
                  key={c}
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: cell || (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                    border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className={`w-32 flex-shrink-0 border-l p-3 flex flex-col gap-4 ${dark ? "border-white/10" : "border-gray-200"}`}>
        <div>
          <div className={`text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>Score</div>
          <div className="text-lg font-bold tabular-nums">{score}</div>
        </div>
        <div>
          <div className={`text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>Lines</div>
          <div className="text-lg font-bold tabular-nums">{lines}</div>
        </div>
        <div>
          <div className={`text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>Level</div>
          <div className="text-lg font-bold tabular-nums">{level}</div>
        </div>
        <div className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
          ← → Move<br />↑ Rotate<br />↓ Soft drop<br />Space Hard drop<br />P Pause
        </div>
        {gameOver && (
          <div className="text-red-400 text-sm font-medium">Game Over!</div>
        )}
        {paused && playing && (
          <div className="text-yellow-400 text-sm font-medium">Paused</div>
        )}
        <button
          className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-sm transition-colors mt-auto"
          onClick={startGame}
        >
          {playing ? "Restart" : "Start"}
        </button>
      </div>
    </div>
  );
};

export default TetrisApp;
