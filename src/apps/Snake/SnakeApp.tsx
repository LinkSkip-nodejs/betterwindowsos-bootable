import { useEffect, useState, useRef, useCallback } from "react";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

type Difficulty = "easy" | "medium" | "hard";
const SPEEDS: Record<Difficulty, number> = { easy: 200, medium: 130, hard: 70 };

const getHighScore = (): number => {
  try { return parseInt(localStorage.getItem("webos-snake-highscore") ?? "0", 10) || 0; } catch { return 0; }
};
const saveHighScore = (score: number) => {
  try { localStorage.setItem("webos-snake-highscore", String(score)); } catch {}
};

const SnakeApp = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(getHighScore);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [started, setStarted] = useState(false);
  const gameLoopRef = useRef<number>();
  const dirRef = useRef(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    dirRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setStarted(true);
  };

  // Keep dirRef in sync
  useEffect(() => { dirRef.current = direction; }, [direction]);

  // Update high score on game over
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      saveHighScore(score);
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        if (!gameOver && started) setPaused((p) => !p);
        return;
      }
      if (paused || gameOver) return;

      const dir = dirRef.current;
      switch (e.key) {
        case "ArrowUp":
          if (dir.y === 0) { const d = { x: 0, y: -1 }; dirRef.current = d; setDirection(d); }
          break;
        case "ArrowDown":
          if (dir.y === 0) { const d = { x: 0, y: 1 }; dirRef.current = d; setDirection(d); }
          break;
        case "ArrowLeft":
          if (dir.x === 0) { const d = { x: -1, y: 0 }; dirRef.current = d; setDirection(d); }
          break;
        case "ArrowRight":
          if (dir.x === 0) { const d = { x: 1, y: 0 }; dirRef.current = d; setDirection(d); }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paused, gameOver, started]);

  useEffect(() => {
    if (gameOver || paused || !started) return;

    const move = () => {
      setSnake((prev) => {
        const d = dirRef.current;
        const head = { x: prev[0].x + d.x, y: prev[0].y + d.y };

        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE ||
          prev.some((s) => s.x === head.x && s.y === head.y)
        ) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    };

    gameLoopRef.current = window.setInterval(move, SPEEDS[difficulty]);
    return () => clearInterval(gameLoopRef.current);
  }, [direction, food, gameOver, paused, started, difficulty, generateFood]);

  // Start screen
  if (!started) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-4 font-mono text-white gap-6">
        <div className="text-3xl font-bold">🐍 Snake</div>
        <div className="text-white/50 text-sm">High Score: {highScore}</div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-white/40 uppercase tracking-wide">Difficulty</div>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`px-4 py-2 rounded-lg text-sm capitalize ${
                  difficulty === d
                    ? "bg-green-600 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white/70"
                }`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 text-lg font-medium"
          onClick={resetGame}
        >
          Start Game
        </button>

        <div className="text-xs text-white/30 space-y-1 text-center">
          <div>Arrow Keys to move</div>
          <div>Space to pause</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-4 font-mono">
      {/* Header */}
      <div className="mb-3 flex justify-between w-full max-w-[300px] text-white text-sm">
        <div>Score: {score}</div>
        <div className="text-white/40">Best: {highScore}</div>
        <div className="capitalize text-white/40">{difficulty}</div>
      </div>

      {/* Game grid */}
      <div
        className="relative bg-slate-950 border-2 border-slate-700"
        style={{
          width: GRID_SIZE * 15,
          height: GRID_SIZE * 15,
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {snake.map((p, i) => (
          <div
            key={i}
            className={`rounded-sm ${i === 0 ? "bg-green-400" : "bg-green-500"}`}
            style={{
              gridColumnStart: p.x + 1,
              gridRowStart: p.y + 1,
            }}
          />
        ))}
        <div
          className="bg-red-500 rounded-full"
          style={{
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
          }}
        />

        {/* Pause overlay */}
        {paused && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-white text-xl font-bold">PAUSED</div>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <div className="text-red-400 text-xl font-bold">GAME OVER</div>
            <div className="text-white text-sm">Score: {score}</div>
            {score > 0 && score >= highScore && (
              <div className="text-yellow-400 text-xs">New High Score!</div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-3">
        {gameOver ? (
          <>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm"
              onClick={resetGame}
            >
              Play Again
            </button>
            <button
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
              onClick={() => setStarted(false)}
            >
              Menu
            </button>
          </>
        ) : (
          <button
            className="px-4 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 text-sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-white/30">
        Arrow Keys to move · Space to {paused ? "resume" : "pause"}
      </div>
    </div>
  );
};

export default SnakeApp;
