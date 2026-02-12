import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../os/state/store";
import { runCommand } from "./commands";

type Props = {
  windowId: string;
};

const TerminalApp = ({ windowId }: Props) => {
  const store = useStore();
  const [cwdId, setCwdId] = useState(() => store.fs.rootId);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [output, setOutput] = useState<string[]>([
    "Welcome to WebOS Terminal. Type 'help'.",
  ]);
  const [command, setCommand] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const prompt = useMemo(() => {
    const node = store.fs.nodes[cwdId];
    const path = node?.parentId ? node.name : "";
    return `user@webos:~/${path}$`;
  }, [cwdId, store.fs.nodes]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [windowId]);

  const handleRun = () => {
    const result = runCommand(command, cwdId, store);
    if (result.clear) {
      setOutput([]);
    } else {
      setOutput((prev) => [...prev, ...result.output]);
    }
    if (result.nextCwd) setCwdId(result.nextCwd);
    setHistory((prev) => [...prev, command]);
    setHistoryIndex(null);
    setCommand("");
  };

  return (
    <div className="h-full bg-black/70 text-green-200 font-mono text-xs flex flex-col">
      <div className="flex-1 overflow-auto p-3 space-y-1">
        {output.map((line, index) => (
          <div key={`${line}-${index}`} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>
      <div className="border-t border-green-500/30 px-3 py-2 flex items-center gap-2">
        <span className="text-green-300">{prompt}</span>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleRun();
            if (event.key === "ArrowUp") {
              const nextIndex =
                historyIndex === null ? history.length - 1 : historyIndex - 1;
              const next = history[nextIndex];
              if (next) {
                setCommand(next);
                setHistoryIndex(nextIndex);
              }
            }
            if (event.key === "ArrowDown") {
              if (historyIndex === null) return;
              const nextIndex = historyIndex + 1;
              if (nextIndex >= history.length) {
                setCommand("");
                setHistoryIndex(null);
                return;
              }
              const next = history[nextIndex];
              if (next) {
                setCommand(next);
                setHistoryIndex(nextIndex);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default TerminalApp;
