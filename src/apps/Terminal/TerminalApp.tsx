import { useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";
import { runCommand, getCompletions } from "./commands";

type Props = { windowId: string };

/** Build the full path from root for display */
const getFullPath = (fs: { nodes: Record<string, any>; rootId: string }, nodeId: string): string => {
  const parts: string[] = [];
  let current = fs.nodes[nodeId];
  while (current && current.parentId) {
    parts.unshift(current.name);
    current = fs.nodes[current.parentId];
  }
  return "/" + parts.join("/");
};

const TerminalApp = ({ windowId }: Props) => {
  const store = useStore();
  const [cwdId, setCwdId] = useState(() => store.fs.rootId);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [output, setOutput] = useState<string[]>([
    "Better Windows OS Terminal v3.0.0",
    "Type 'help' for available commands.",
    "",
  ]);
  const [command, setCommand] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const fullPath = getFullPath(store.fs, cwdId);
  const prompt = `${store.username || "user"}@webos:${fullPath}$`;

  useEffect(() => {
    inputRef.current?.focus();
  }, [windowId]);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleRun = () => {
    const result = runCommand(command, cwdId, store);
    if (result.clear) {
      setOutput([]);
    } else {
      setOutput((prev) => [...prev, ...result.output]);
    }
    if (result.nextCwd) setCwdId(result.nextCwd);
    if (command.trim()) {
      setHistory((prev) => [...prev, command]);
    }
    setHistoryIndex(null);
    setCommand("");
  };

  const handleTab = () => {
    // Extract the last "word" for completion
    const parts = command.split(/\s+/);
    const lastWord = parts[parts.length - 1] || "";
    const completions = getCompletions(lastWord, cwdId, store);

    if (completions.length === 1) {
      parts[parts.length - 1] = completions[0];
      setCommand(parts.join(" "));
    } else if (completions.length > 1) {
      setOutput((prev) => [...prev, `${prompt} ${command}`, completions.join("  ")]);
    }
  };

  return (
    <div
      className="h-full bg-black/80 text-green-200 font-mono text-xs flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-0.5">
        {output.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap leading-5">
            {line}
          </div>
        ))}
      </div>
      <div className="border-t border-green-500/30 px-3 py-2 flex items-center gap-2">
        <span className="text-green-400 flex-shrink-0">{prompt}</span>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none caret-green-400"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          title="Terminal input"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleRun();
            }
            if (e.key === "Tab") {
              e.preventDefault();
              handleTab();
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const nextIndex = historyIndex === null ? history.length - 1 : historyIndex - 1;
              if (history[nextIndex] !== undefined) {
                setCommand(history[nextIndex]);
                setHistoryIndex(nextIndex);
              }
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (historyIndex === null) return;
              const nextIndex = historyIndex + 1;
              if (nextIndex >= history.length) {
                setCommand("");
                setHistoryIndex(null);
              } else {
                setCommand(history[nextIndex]);
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
