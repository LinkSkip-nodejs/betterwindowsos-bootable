import { memo, useEffect, useState } from "react";
import { useStore } from "../state/store";
import { useShallow } from "zustand/react/shallow";
import { sounds } from "../utils/sounds";

type Toast = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  exiting?: boolean;
};

const typeIcons: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

const NotificationToast = memo(() => {
  // Only subscribe to the latest notification's data, not the whole array
  const latestNotif = useStore(
    useShallow((s) => {
      const n = s.notifications[0];
      return n ? { id: n.id, title: n.title, message: n.message, type: n.type } : null;
    })
  );
  const muted = useStore((s) => s.muted);
  const locked = useStore((s) => s.locked);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  // Watch for new notifications and show toast
  useEffect(() => {
    if (locked) return;
    const latest = latestNotif;
    if (!latest || seen.has(latest.id)) return;

    setSeen((prev) => new Set(prev).add(latest.id));

    const toast: Toast = {
      id: latest.id,
      title: latest.title,
      message: latest.message,
      type: latest.type,
    };

    setToasts((prev) => [toast, ...prev].slice(0, 3));

    if (!muted) {
      if (latest.type === "error") sounds.error();
      else sounds.notification();
    }

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === toast.id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 300);
    }, 4000);
  }, [latestNotif, seen, muted, locked]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto glass rounded-xl px-4 py-3 min-w-[280px] max-w-[360px] shadow-lg flex items-start gap-3 ${
            toast.exiting ? "notif-exit" : "notif-enter"
          }`}
        >
          <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
            {typeIcons[toast.type]}
          </span>
          <div className="min-w-0">
            <div className="font-medium text-sm">{toast.title}</div>
            <div className="text-xs text-white/60 mt-0.5 truncate">
              {toast.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

NotificationToast.displayName = "NotificationToast";
export default NotificationToast;
