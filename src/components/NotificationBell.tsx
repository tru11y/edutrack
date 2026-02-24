import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { Timestamp } from "firebase/firestore";

interface Notification {
  id: string;
  message: string;
  actorName: string;
  type: string;
  status: "unread" | "read";
  createdAt: Timestamp | null;
}

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M15 7C15 5.67 14.47 4.4 13.54 3.46C12.6 2.53 11.33 2 10 2C8.67 2 7.4 2.53 6.46 3.46C5.53 4.4 5 5.67 5 7C5 12 2.5 13.5 2.5 13.5H17.5C17.5 13.5 15 12 15 7Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.45 17C11.22 17.38 10.88 17.65 10.49 17.81C10.1 17.97 9.67 17.97 9.28 17.81C8.89 17.65 8.55 17.38 8.32 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function NotificationBell() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;
    if (user.role !== "admin" && user.role !== "gestionnaire") return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        where("status", "==", "unread"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    } catch {
      // silent — non-critical
    }
  }, [user?.uid, user?.role]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { status: "read" });
  };

  const markAllRead = async () => {
    if (notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((n) =>
      batch.update(doc(db, "notifications", n.id), { status: "read" })
    );
    await batch.commit();
  };

  if (!user || (user.role !== "admin" && user.role !== "gestionnaire")) return null;

  const unreadCount = notifications.length;

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return "";
    try {
      return ts.toDate().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: open ? colors.primary : colors.textMuted,
          padding: 4,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: colors.primary,
                  padding: 0,
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: colors.textMuted,
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Aucune notification non lue
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: "pointer",
                    background: `${colors.primary}0d`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = `${colors.primary}1a`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = `${colors.primary}0d`;
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: colors.text, lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.textMuted }}>
                    {n.actorName} · {formatTime(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
