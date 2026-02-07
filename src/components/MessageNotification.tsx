import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useMessageNotifications, type NotificationMessage } from "../hooks/useMessageNotifications";

function NotificationCard({ msg, onDismiss }: { msg: NotificationMessage & { _key: string }; onDismiss: () => void }) {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    onDismiss();
    navigate("/messages");
  };

  const truncated = msg.contenu.length > 80 ? msg.contenu.slice(0, 80) + "..." : msg.contenu;

  return (
    <div
      onClick={handleClick}
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.primary}`,
        borderRadius: 12,
        padding: 14,
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        opacity: exiting ? 0 : visible ? 1 : 0,
        transform: exiting ? "translateX(120%)" : visible ? "translateX(0)" : "translateX(120%)",
        transition: "all 0.3s ease",
        maxWidth: 320,
        position: "relative",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setExiting(true); setTimeout(onDismiss, 300); }}
        style={{
          position: "absolute", top: 6, right: 6,
          background: "none", border: "none", cursor: "pointer",
          color: colors.textMuted, fontSize: 16, lineHeight: 1, padding: 2,
        }}
      >
        x
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: msg.auteurRole === "prof" ? colors.successBg : colors.primaryBg,
          color: msg.auteurRole === "prof" ? colors.success : colors.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600,
        }}>
          {msg.auteurNom?.[0]?.toUpperCase() || "?"}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{msg.auteurNom}</span>
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.4 }}>{truncated}</p>
    </div>
  );
}

export default function MessageNotificationContainer() {
  const { user } = useAuth();
  const location = useLocation();
  const { notifications, dismiss } = useMessageNotifications();

  // Don't show on login or messages page
  if (!user || location.pathname === "/login" || location.pathname === "/messages") return null;

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: 80,
      right: 20,
      zIndex: 9998,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {notifications.map((msg) => (
        <NotificationCard key={msg.id} msg={{ ...msg, _key: msg.id }} onDismiss={() => dismiss(msg.id)} />
      ))}
    </div>
  );
}
