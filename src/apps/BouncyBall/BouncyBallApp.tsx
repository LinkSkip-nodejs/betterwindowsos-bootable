import { useEffect, useRef, useState } from "react";

const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 12;

const BouncyBallApp = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paddleLeft, setPaddleLeft] = useState(100);
  const [paddleRight, setPaddleRight] = useState(100);
  const [ball, setBall] = useState({ x: 250, y: 150, dx: 4, dy: 3 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const cappedY = Math.max(0, Math.min(rect.height - PADDLE_HEIGHT, relativeY - PADDLE_HEIGHT / 2));
      setPaddleLeft(cappedY);
      setPaddleRight(cappedY); // Mirror for simplicity or use keys for one
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();

      setBall((prev) => {
        let { x, y, dx, dy } = prev;
        x += dx;
        y += dy;

        // Top/Bottom bounce
        if (y <= 0 || y >= height - BALL_SIZE) dy = -dy;

        // Left paddle check
        if (x <= PADDLE_WIDTH) {
          if (y + BALL_SIZE >= paddleLeft && y <= paddleLeft + PADDLE_HEIGHT) {
            dx = -dx;
            x = PADDLE_WIDTH;
            setScore((s) => s + 1);
          } else {
            setGameOver(true);
          }
        }

        // Right paddle check
        if (x >= width - PADDLE_WIDTH - BALL_SIZE) {
          if (y + BALL_SIZE >= paddleRight && y <= paddleRight + PADDLE_HEIGHT) {
            dx = -dx;
            x = width - PADDLE_WIDTH - BALL_SIZE;
            setScore((s) => s + 1);
          } else {
            setGameOver(true);
          }
        }

        return { x, y, dx, dy };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameOver, paddleLeft, paddleRight]);

  const resetGame = () => {
    setBall({ x: 250, y: 150, dx: 4, dy: 3 });
    setScore(0);
    setGameOver(false);
  };

  return (
    <div 
      ref={containerRef}
      className="h-full w-full bg-slate-950 relative overflow-hidden cursor-none"
    >
      <div className="absolute top-4 w-full text-center text-white font-mono text-2xl z-10">
        SCORE: {score}
      </div>

      {/* Left Paddle */}
      <div
        className="absolute left-0 bg-blue-500 rounded-r-lg"
        style={{
          top: paddleLeft,
          width: PADDLE_WIDTH,
          height: PADDLE_HEIGHT,
        }}
      />

      {/* Right Paddle */}
      <div
        className="absolute right-0 bg-red-500 rounded-l-lg"
        style={{
          top: paddleRight,
          width: PADDLE_WIDTH,
          height: PADDLE_HEIGHT,
        }}
      />

      {/* Ball */}
      <div
        className="absolute bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        style={{
          left: ball.x,
          top: ball.y,
          width: BALL_SIZE,
          height: BALL_SIZE,
        }}
      />

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
          <div className="text-white text-4xl font-bold mb-4">GAME OVER</div>
          <div className="text-white text-xl mb-8">FINAL SCORE: {score}</div>
          <button
            className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-slate-200 cursor-default"
            onClick={resetGame}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      <div className="absolute bottom-4 w-full text-center text-white/20 text-xs">
        Move mouse vertically to control paddles
      </div>
    </div>
  );
};

export default BouncyBallApp;
