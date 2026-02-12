import { useStore } from "../../os/state/store";

type Props = {
  windowId: string;
};

const RecycleBinApp = ({ windowId: _windowId }: Props) => {
  const fs = useStore((s) => s.fs);
  const fsRestore = useStore((s) => s.fsRestore);
  const fsEmpty = useStore((s) => s.fsEmptyRecycle);

  const items = fs.recycleBin.map((id) => fs.nodes[id]).filter(Boolean);

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="font-medium">Recycle Bin</div>
        <button
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
          onClick={fsEmpty}
        >
          Empty bin
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {items.length === 0 ? (
          <div className="text-white/60">Recycle Bin is empty.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span>{item.type === "folder" ? "📁" : "📄"}</span>
                  <span>{item.name}</span>
                </div>
                <button
                  className="px-2 py-1 rounded-lg hover:bg-white/10"
                  onClick={() => fsRestore(item.id)}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBinApp;
