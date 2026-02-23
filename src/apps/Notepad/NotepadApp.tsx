import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../os/state/store";

type Props = { windowId: string };

const NotepadApp = ({ windowId }: Props) => {
  const win = useStore((s) => s.windows.find((w) => w.id === windowId));
  const fs = useStore((s) => s.fs);
  const fsWrite = useStore((s) => s.fsWrite);
  const fsTouch = useStore((s) => s.fsTouch);
  const updateWindow = useStore((s) => s.updateWindow);
  const clipboardCopy = useStore((s) => s.clipboardCopy);
  const clipboardPaste = useStore((s) => s.clipboardPaste);
  const notify = useStore((s) => s.notify);

  const [content, setContent] = useState("");
  const [fileId, setFileId] = useState<string | undefined>(
    win?.payload?.fileId as string | undefined
  );
  const [fileName, setFileName] = useState(
    (win?.payload?.fileName as string | undefined) ?? "Untitled"
  );
  const [modified, setModified] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Load file content
  useEffect(() => {
    if (fileId) {
      const node = fs.nodes[fileId];
      if (node?.type === "file") {
        setContent(node.content ?? "");
        setFileName(node.name);
        updateWindow(windowId, { title: `${node.name} - Notepad` });
        setModified(false);
      }
    } else {
      updateWindow(windowId, { title: "Untitled - Notepad" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  const handleSave = useCallback(() => {
    if (fileId) {
      fsWrite(fileId, content);
      setModified(false);
      notify("Notepad", `Saved ${fileName}`, "success");
    } else {
      const desktopNode = Object.values(fs.nodes).find(
        (n) => n.name === "Desktop" && n.type === "folder" && n.parentId === fs.rootId
      );
      if (desktopNode) {
        const name = fileName === "Untitled" ? "New File.txt" : fileName;
        fsTouch(desktopNode.id, name, content);
        const created = Object.values(fs.nodes).find(
          (n) => n.name === name && n.parentId === desktopNode.id && !n.deleted
        );
        if (created) {
          setFileId(created.id);
          setFileName(name);
          updateWindow(windowId, { title: `${name} - Notepad` });
        }
        setModified(false);
        notify("Notepad", `Created ${name} on Desktop`, "success");
      }
    }
  }, [fileId, content, fileName, fs, fsWrite, fsTouch, notify, updateWindow, windowId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setModified(true);
  };

  const updateCursorInfo = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = ta.value.substring(0, pos);
    const line = before.split("\n").length;
    const col = pos - before.lastIndexOf("\n");
    setCursorInfo({ line, col });
  };

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFindNext = () => {
    const ta = textareaRef.current;
    if (!ta || !findText) return;
    const start = ta.selectionEnd;
    let idx = content.toLowerCase().indexOf(findText.toLowerCase(), start);
    if (idx < 0) idx = content.toLowerCase().indexOf(findText.toLowerCase());
    if (idx >= 0) {
      ta.setSelectionRange(idx, idx + findText.length);
      ta.focus();
    }
  };

  const handleReplaceNext = () => {
    const ta = textareaRef.current;
    if (!ta || !findText) return;
    const selText = content.substring(ta.selectionStart, ta.selectionEnd);
    if (selText.toLowerCase() === findText.toLowerCase()) {
      const before = content.substring(0, ta.selectionStart);
      const after = content.substring(ta.selectionEnd);
      setContent(before + replaceText + after);
      setModified(true);
    }
    handleFindNext();
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    setContent(content.replace(regex, replaceText));
    setModified(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    }
    if (e.ctrlKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      setShowFind(true);
    }
    if (e.ctrlKey && e.key.toLowerCase() === "h") {
      e.preventDefault();
      setShowFind(true);
    }
    if (e.ctrlKey && e.key === "=") {
      e.preventDefault();
      setFontSize((s) => Math.min(s + 2, 32));
    }
    if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      setFontSize((s) => Math.max(s - 2, 8));
    }
    if (e.key === "Escape" && showFind) setShowFind(false);
  };

  const lineCount = content.split("\n").length;
  const allFiles = Object.values(fs.nodes).filter((n) => n.type === "file" && !n.deleted);

  return (
    <div className="flex h-full flex-col text-sm relative" onKeyDown={handleKeyDown}>
      {/* Menu bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10 text-xs relative z-20">
        <div className="relative">
          <button
            className={`px-2 py-1 rounded ${showFileMenu ? "bg-white/10" : "hover:bg-white/10"}`}
            onClick={() => { setShowFileMenu(!showFileMenu); setShowEditMenu(false); }}
          >
            File
          </button>
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 glass rounded-lg py-1 min-w-[180px] shadow-lg">
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10" onClick={() => {
                setFileId(undefined); setFileName("Untitled"); setContent(""); setModified(false);
                updateWindow(windowId, { title: "Untitled - Notepad" }); setShowFileMenu(false);
              }}>
                New
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10" onClick={() => { setShowOpenDialog(true); setShowFileMenu(false); }}>
                Open...
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between" onClick={() => { handleSave(); setShowFileMenu(false); }}>
                <span>Save</span><span className="text-white/30">Ctrl+S</span>
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10" onClick={() => { setWordWrap(!wordWrap); setShowFileMenu(false); }}>
                {wordWrap ? "Disable" : "Enable"} Word Wrap
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className={`px-2 py-1 rounded ${showEditMenu ? "bg-white/10" : "hover:bg-white/10"}`}
            onClick={() => { setShowEditMenu(!showEditMenu); setShowFileMenu(false); }}
          >
            Edit
          </button>
          {showEditMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 glass rounded-lg py-1 min-w-[180px] shadow-lg">
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between" onClick={() => { document.execCommand("undo"); setShowEditMenu(false); }}>
                <span>Undo</span><span className="text-white/30">Ctrl+Z</span>
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between" onClick={() => { document.execCommand("redo"); setShowEditMenu(false); }}>
                <span>Redo</span><span className="text-white/30">Ctrl+Y</span>
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between" onClick={() => {
                const ta = textareaRef.current;
                if (ta) {
                  const sel = content.substring(ta.selectionStart, ta.selectionEnd);
                  if (sel) clipboardCopy("text", { text: sel }, "notepad");
                }
                setShowEditMenu(false);
              }}>
                <span>Copy</span><span className="text-white/30">Ctrl+C</span>
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between" onClick={() => {
                const clip = clipboardPaste();
                if (clip?.text) {
                  const ta = textareaRef.current;
                  if (ta) {
                    const before = content.substring(0, ta.selectionStart);
                    const after = content.substring(ta.selectionEnd);
                    setContent(before + clip.text + after);
                    setModified(true);
                  }
                }
                setShowEditMenu(false);
              }}>
                <span>Paste</span><span className="text-white/30">Ctrl+V</span>
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between" onClick={() => { setShowFind(true); setShowEditMenu(false); }}>
                <span>Find/Replace</span><span className="text-white/30">Ctrl+F</span>
              </button>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 text-white/40">
          {modified && <span className="text-yellow-400/60">Modified</span>}
          <span>{fileName}</span>
        </div>
      </div>

      {/* Find/Replace bar */}
      {showFind && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
          <input className="bg-white/10 rounded px-2 py-1 text-xs outline-none w-36" placeholder="Find..." value={findText}
            onChange={(e) => setFindText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleFindNext(); }} autoFocus />
          <input className="bg-white/10 rounded px-2 py-1 text-xs outline-none w-36" placeholder="Replace..." value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)} />
          <button className="px-2 py-1 text-xs rounded hover:bg-white/10" onClick={handleFindNext}>Next</button>
          <button className="px-2 py-1 text-xs rounded hover:bg-white/10" onClick={handleReplaceNext}>Replace</button>
          <button className="px-2 py-1 text-xs rounded hover:bg-white/10" onClick={handleReplaceAll}>All</button>
          <button className="px-2 py-1 text-xs rounded hover:bg-white/10 ml-auto" onClick={() => setShowFind(false)}>X</button>
        </div>
      )}

      {/* Editor with line numbers */}
      <div className="flex-1 flex overflow-hidden" onClick={() => { setShowFileMenu(false); setShowEditMenu(false); }}>
        <div ref={lineNumbersRef} className="w-12 flex-shrink-0 overflow-hidden text-right pr-2 py-3 text-white/20 select-none border-r border-white/5 leading-relaxed"
          style={{ fontSize }}>
          {Array.from({ length: lineCount }, (_, i) => <div key={i + 1}>{i + 1}</div>)}
        </div>
        <textarea ref={textareaRef}
          className="flex-1 bg-transparent p-3 outline-none resize-none leading-relaxed font-mono"
          style={{ fontSize, whiteSpace: wordWrap ? "pre-wrap" : "pre", overflowWrap: wordWrap ? "break-word" : undefined }}
          value={content} onChange={handleChange} onScroll={handleScroll}
          onClick={updateCursorInfo} onKeyUp={updateCursorInfo} spellCheck={false}
          title="Editor" placeholder="Start typing..." />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-white/10 text-[11px] text-white/40">
        <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
        <div className="flex items-center gap-3">
          <span>{content.length} chars</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{lineCount} lines</span>
          <span>Font: {fontSize}px</span>
        </div>
      </div>

      {/* Open file dialog */}
      {showOpenDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass rounded-xl p-4 w-80 max-h-80 overflow-auto">
            <div className="font-medium mb-3">Open File</div>
            {allFiles.length === 0 ? (
              <div className="text-xs text-white/40">No files found</div>
            ) : (
              <div className="space-y-1">
                {allFiles.map((f) => (
                  <button key={f.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-xs flex items-center gap-2"
                    onClick={() => { setFileId(f.id); setShowOpenDialog(false); }}>
                    <span>📄</span><span>{f.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="mt-3 w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs" onClick={() => setShowOpenDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotepadApp;
