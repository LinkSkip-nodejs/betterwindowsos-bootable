import { useCallback, useState } from "react";
import { useStore } from "../../os/state/store";

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };
type Difficulty = { rows: number; cols: number; mines: number; label: string };

const DIFFICULTIES: Difficulty[] = [
  { rows: 9, cols: 9, mines: 10, label: "Easy" },
  { rows: 16, cols: 16, mines: 40, label: "Medium" },
  { rows: 16, cols: 30, mines: 99, label: "Hard" },
];

const createBoard = (rows: number, cols: number, mines: number): Cell[][] => {
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
  // Place mines
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }
  // Count adjacent
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }
  return board;
};

const MinesweeperApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const [diff, setDiff] = useState(DIFFICULTIES[0]);
  const [board, setBoard] = useState(() => createBoard(diff.rows, diff.cols, diff.mines));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [timerRef] = useState<{ id: number }>({ id: 0 });
  const [started, setStarted] = useState(false);

  const startTimer = useCallback(() => {
    if (timerRef.id) clearInterval(timerRef.id);
    timerRef.id = window.setInterval(() => setTime((t) => t + 1), 1000);
  }, [timerRef]);

  const newGame = (d: Difficulty) => {
    setDiff(d);
    setBoard(createBoard(d.rows, d.cols, d.mines));
    setGameOver(false);
    setWon(false);
    setTime(0);
    setStarted(false);
    if (timerRef.id) clearInterval(timerRef.id);
  };

  const reveal = (r: number, c: number) => {
    if (gameOver || won || board[r][c].flagged || board[r][c].revealed) return;
    if (!started) { setStarted(true); startTimer(); }

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

    if (newBoard[r][c].mine) {
      // Game over — reveal all mines
      for (const row of newBoard) for (const cell of row) if (cell.mine) cell.revealed = true;
      setBoard(newBoard);
      setGameOver(true);
      clearInterval(timerRef.id);
      return;
    }

    // Flood fill reveal
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [cr, cc] = stack.pop()!;
      if (cr < 0 || cr >= diff.rows || cc < 0 || cc >= diff.cols) continue;
      if (newBoard[cr][cc].revealed || newBoard[cr][cc].flagged) continue;
      newBoard[cr][cc].revealed = true;
      if (newBoard[cr][cc].adjacent === 0 && !newBoard[cr][cc].mine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            stack.push([cr + dr, cc + dc]);
          }
        }
      }
    }

    setBoard(newBoard);

    // Check win
    const unrevealed = newBoard.flat().filter((c) => !c.revealed && !c.mine).length;
    if (unrevealed === 0) {
      setWon(true);
      clearInterval(timerRef.id);
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].revealed) return;
    setBoard((prev) =>
      prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? { ...cell, flagged: !cell.flagged } : cell)))
    );
  };

  const flagCount = board.flat().filter((c) => c.flagged).length;
  const CELL_SIZE = diff.cols > 16 ? 20 : 28;

  const adjColors = ["", "#3b82f6", "#16a34a", "#ef4444", "#7c3aed", "#b45309", "#06b6d4", "#1e293b", "#6b7280"];

  return (
    <div className="flex flex-col h-full items-center">
      {/* Header */}
      <div className={`w-full flex items-center justify-between px-4 py-2 border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.label}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                diff.label === d.label ? "bg-blue-500/20 text-blue-400" : dark ? "hover:bg-white/10" : "hover:bg-gray-100"
              }`}
              onClick={() => newGame(d)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>💣 {diff.mines - flagCount}</span>
          <span className="tabular-nums">⏱️ {time}s</span>
          <button
            className={`px-3 py-1 rounded-lg text-xs ${dark ? "bg-white/10 hover:bg-white/15" : "bg-gray-200 hover:bg-gray-300"}`}
            onClick={() => newGame(diff)}
          >
            New
          </button>
        </div>
      </div>

      {/* Status */}
      {(gameOver || won) && (
        <div className={`py-2 text-sm font-medium ${gameOver ? "text-red-400" : "text-green-400"}`}>
          {gameOver ? "💥 Game Over!" : "🎉 You Win!"}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-2">
        <div
          className="grid gap-[1px]"
          style={{
            gridTemplateColumns: `repeat(${diff.cols}, ${CELL_SIZE}px)`,
            gridAutoRows: `${CELL_SIZE}px`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                className={`flex items-center justify-center text-xs font-bold border transition-colors select-none ${
                  cell.revealed
                    ? cell.mine
                      ? "bg-red-500/30 border-red-500/20"
                      : dark
                      ? "bg-white/5 border-white/5"
                      : "bg-gray-50 border-gray-200"
                    : dark
                    ? "bg-white/10 border-white/10 hover:bg-white/20 active:bg-white/5"
                    : "bg-gray-200 border-gray-300 hover:bg-gray-300 active:bg-gray-100"
                }`}
                style={{ width: CELL_SIZE, height: CELL_SIZE, fontSize: CELL_SIZE * 0.45 }}
                onClick={() => reveal(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
              >
                {cell.flagged && !cell.revealed ? "🚩" : cell.revealed ? (cell.mine ? "💣" : cell.adjacent > 0 ? (
                  <span style={{ color: adjColors[cell.adjacent] }}>{cell.adjacent}</span>
                ) : "") : ""}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesweeperApp;
