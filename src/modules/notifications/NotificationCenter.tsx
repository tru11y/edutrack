import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getNotificationsSecure,
  markNotificationReadSecure,
  type NotificationItem,
} from "../../services/cloudFunctions";

export default function NotificationCenter() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotificationsSecure(20);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadNotifications]);

  async function markRead(id: string) {
    try {
      await markNotificationReadSecure(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, status: "read", readAt: new Date().toISOString() } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "absence": return "🔴";
      case "retard": return "🟡";
      case "impaye": return "💰";
      case "bulletin": return "📄";
      default: return "🔔";
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none", border: "none", cursor: "pointer", position: "relative",
          padding: 8, color: colors.textMuted,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 7C15 5.67 14.47 4.4 13.54 3.46C12.6 2.53 11.33 2 10 2C8.67 2 7.4 2.53 6.46 3.46C5.53 4.4 5 5.67 5 7C5 12 2.5 13.5 2.5 13.5H17.5C17.5 13.5 15 12 15 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.45 17C11.22 17.38 10.88 17.65 10.49 17.81C10.1 17.97 9.67 17.97 9.28 17.81C8.89 17.65 8.55 17.38 8.32 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 16, height: 16, borderRadius: "50%",
            background: colors.danger, color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div style={{
            position: "absolute", right: 0, top: "100%", marginTop: 8,
            width: 340, maxHeight: 400, overflowY: "auto",
            background: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            zIndex: 100,
          }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, fontWeight: 600, fontSize: 14, color: colors.text }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.readAt && markRead(n.id)}
                  style={{
                    padding: "10px 16px", borderBottom: `1px solid ${colors.border}`,
                    cursor: n.readAt ? "default" : "pointer",
                    background: n.readAt ? "transparent" : colors.primaryBg,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16 }}>{getTypeIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: n.readAt ? 400 : 600, color: colors.text }}>
                        {n.payload.title}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {n.payload.message}
                      </div>
                      {n.createdAt && (
                        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                          {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
