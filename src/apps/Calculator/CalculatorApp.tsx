import { useState } from "react";
import { useStore } from "../../os/state/store";

const CalculatorApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const inputDigit = (d: string) => {
    if (reset) {
      setDisplay(d);
      setReset(false);
    } else {
      setDisplay(display === "0" ? d : display + d);
    }
  };

  const inputDot = () => {
    if (reset) { setDisplay("0."); setReset(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const inputOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op && !reset) {
      const result = calculate(prev, current, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setReset(true);
  };

  const calculate = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    const expr = `${prev} ${op} ${current} = ${result}`;
    setHistory((h) => [expr, ...h].slice(0, 20));
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setReset(true);
  };

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setReset(false); };
  const toggleSign = () => setDisplay(String(parseFloat(display) * -1));
  const percent = () => setDisplay(String(parseFloat(display) / 100));
  const backspace = () => setDisplay(display.length > 1 ? display.slice(0, -1) : "0");

  const btn = (label: string, action: () => void, cls?: string) => (
    <button
      className={`rounded-xl text-lg font-medium transition-colors active:scale-95 ${cls || (dark ? "bg-white/10 hover:bg-white/15" : "bg-gray-100 hover:bg-gray-200")}`}
      onClick={action}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Display */}
      <div className={`rounded-xl px-4 py-3 text-right ${dark ? "bg-white/5" : "bg-gray-50"}`}>
        {op && prev !== null && (
          <div className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>{prev} {op}</div>
        )}
        <div className="text-3xl font-light tabular-nums truncate">{display}</div>
      </div>

      {/* Buttons grid */}
      <div className="grid grid-cols-4 gap-2 flex-1" style={{ gridAutoRows: "1fr" }}>
        {btn("C", clear, dark ? "bg-white/5 hover:bg-white/10 text-red-400" : "bg-red-50 hover:bg-red-100 text-red-500")}
        {btn("±", toggleSign)}
        {btn("%", percent)}
        {btn("÷", () => inputOp("/"), "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400")}

        {btn("7", () => inputDigit("7"))}
        {btn("8", () => inputDigit("8"))}
        {btn("9", () => inputDigit("9"))}
        {btn("×", () => inputOp("*"), "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400")}

        {btn("4", () => inputDigit("4"))}
        {btn("5", () => inputDigit("5"))}
        {btn("6", () => inputDigit("6"))}
        {btn("-", () => inputOp("-"), "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400")}

        {btn("1", () => inputDigit("1"))}
        {btn("2", () => inputDigit("2"))}
        {btn("3", () => inputDigit("3"))}
        {btn("+", () => inputOp("+"), "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400")}

        {btn("⌫", backspace)}
        {btn("0", () => inputDigit("0"))}
        {btn(".", inputDot)}
        {btn("=", handleEquals, "bg-blue-500 hover:bg-blue-600 text-white")}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className={`max-h-16 overflow-auto rounded-lg px-3 py-1 text-xs ${dark ? "bg-white/5 text-white/40" : "bg-gray-50 text-gray-400"}`}>
          {history.map((h, i) => <div key={i}>{h}</div>)}
        </div>
      )}
    </div>
  );
};

export default CalculatorApp;
