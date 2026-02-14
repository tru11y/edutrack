import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getNotificationsSecure,
  markNotificationReadSecure,
  type NotificationItem,
} from "../../services/cloudFunctions";

export default function NotificationsList() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotificationsSecure(100);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  async function markRead(id: string) {
    try {
      await markNotificationReadSecure(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, status: "read", readAt: new Date().toISOString() } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.readAt);
    for (const n of unread) {
      await markNotificationReadSecure(n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read", readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "absence": return "🔴";
      case "retard": return "🟡";
      case "impaye": return "💰";
      case "bulletin": return "📄";
      case "general": return "📢";
      default: return "🔔";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "absence": return "Absence";
      case "retard": return "Retard";
      case "impaye": return "Impaye";
      case "bulletin": return "Bulletin";
      case "general": return "General";
      default: return type;
    }
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Toutes lues"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ padding: "8px 16px", background: colors.primaryBg, color: colors.primary, border: `1px solid ${colors.primary}30`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: colors.bgSecondary, borderRadius: 8, padding: 3, width: "fit-content" }}>
        <button onClick={() => setFilter("all")} style={{ padding: "8px 16px", background: filter === "all" ? colors.bgCard : "transparent", color: filter === "all" ? colors.text : colors.textMuted, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Toutes ({notifications.length})
        </button>
        <button onClick={() => setFilter("unread")} style={{ padding: "8px 16px", background: filter === "unread" ? colors.bgCard : "transparent", color: filter === "unread" ? colors.text : colors.textMuted, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Non lues ({unreadCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMuted }}>
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>🔔</p>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Aucune notification</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.readAt && markRead(n.id)}
              style={{
                background: n.readAt ? colors.bgCard : colors.primaryBg,
                border: `1px solid ${n.readAt ? colors.border : colors.primary + "30"}`,
                borderRadius: 12, padding: 16, cursor: n.readAt ? "default" : "pointer",
                transition: "background 0.2s",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>{getTypeIcon(n.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: n.readAt ? 400 : 600, color: colors.text }}>{n.payload.title}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 500, background: colors.bgHover, color: colors.textMuted }}>
                      {getTypeLabel(n.type)}
                    </span>
                    {!n.readAt && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.primary }} />
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{n.payload.message}</p>
                  {n.createdAt && (
                    <p style={{ fontSize: 11, color: colors.textMuted, margin: "6px 0 0" }}>
                      {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
