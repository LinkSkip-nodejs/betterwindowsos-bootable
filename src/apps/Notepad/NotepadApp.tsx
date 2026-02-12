import { useEffect, useState } from "react";
import { useStore } from "../../os/state/store";

type Props = {
  windowId: string;
};

const NotepadApp = ({ windowId }: Props) => {
  const window = useStore((s) => s.windows.find((w) => w.id === windowId));
  const fs = useStore((s) => s.fs);
  const fsWrite = useStore((s) => s.fsWrite);
  const updateWindow = useStore((s) => s.updateWindow);
  const [content, setContent] = useState("");

  const fileId = window?.payload?.fileId as string | undefined;
  const fileName = (window?.payload?.fileName as string | undefined) ?? "Untitled";

  useEffect(() => {
    if (fileId) {
      const node = fs.nodes[fileId];
      if (node?.type === "file") {
        setContent(node.content ?? "");
        updateWindow(windowId, { title: node.name });
      }
    } else {
      updateWindow(windowId, { title: "Notepad" });
    }
  }, [fileId, fs.nodes, updateWindow, windowId]);

  const handleSave = () => {
    if (fileId) {
      fsWrite(fileId, content);
    }
  };

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10">
        <div className="text-xs text-white/60">{fileName}</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded hover:bg-white/10">File</button>
          <button className="px-2 py-1 rounded hover:bg-white/10">Edit</button>
        </div>
        <button
          className="ml-auto px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
      <textarea
        className="flex-1 bg-transparent p-3 outline-none resize-none text-sm leading-relaxed"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
    </div>
  );
};

export default NotepadApp;
