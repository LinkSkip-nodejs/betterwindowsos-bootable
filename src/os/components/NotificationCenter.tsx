import { useStore, type Notification } from "../state/store";

const typeIcon: Record<Notification["type"], string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

const formatAgo = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const NotificationCenter = ({ open, onClose }: Props) => {
  const notifications = useStore((s) => s.notifications);
  const dismissNotification = useStore((s) => s.dismissNotification);
  const clearNotifications = useStore((s) => s.clearNotifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const dndMode = useStore((s) => s.dndMode);
  const setDndMode = useStore((s) => s.setDndMode);
  const theme = useStore((s) => s.theme);

  if (!open) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className={`absolute right-4 bottom-[62px] w-80 max-h-[500px] rounded-2xl shadow-glass p-3 flex flex-col animate-[fadeIn_0.18s_ease] ${
          theme === "dark" ? "glass" : "glass-light"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="font-medium text-sm">
            Notifications {unread > 0 && <span className="text-xs text-white/50">({unread} new)</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`text-xs px-2 py-1 rounded-lg ${
                dndMode ? "bg-red-500/20 text-red-300" : "hover:bg-white/10 text-white/60"
              }`}
              onClick={() => setDndMode(!dndMode)}
              title="Do Not Disturb"
            >
              {dndMode ? "DND On" : "DND"}
            </button>
            {notifications.length > 0 && (
              <button
                className="text-xs px-2 py-1 rounded-lg hover:bg-white/10 text-white/60"
                onClick={clearNotifications}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto space-y-1">
          {notifications.length === 0 && (
            <div className="text-center text-white/40 text-xs py-8">
              No notifications
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-2 px-2 py-2 rounded-lg text-xs ${
                n.read ? "opacity-60" : "bg-white/5"
              } hover:bg-white/10`}
              onClick={() => {
                if (!n.read) markNotificationRead(n.id);
              }}
            >
              <span className="shrink-0 mt-0.5">{typeIcon[n.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{n.title}</div>
                <div className="text-white/60 truncate">{n.message}</div>
                <div className="text-white/40 mt-0.5">{formatAgo(n.timestamp)}</div>
              </div>
              <button
                className="shrink-0 h-5 w-5 rounded hover:bg-white/20 text-white/40 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(n.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
