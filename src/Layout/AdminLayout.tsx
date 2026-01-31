import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface NavItem {
  to: string;
  labelKey: string;
  icon: string;
  end?: boolean;
  roles: ("admin" | "gestionnaire" | "prof")[];
}

const navItems: NavItem[] = [
  { to: "/", labelKey: "dashboard", icon: "dashboard", end: true, roles: ["admin", "gestionnaire"] },
  { to: "/eleves", labelKey: "students", icon: "users", roles: ["admin", "gestionnaire"] },
  { to: "/mes-eleves", labelKey: "myStudents", icon: "users", roles: ["prof"] },
  { to: "/presences", labelKey: "presences", icon: "check", roles: ["admin", "gestionnaire", "prof"] },
  { to: "/cahier", labelKey: "textbook", icon: "book", roles: ["admin", "gestionnaire", "prof"] },
  { to: "/paiements", labelKey: "payments", icon: "card", roles: ["admin", "gestionnaire"] },
  { to: "/stats", labelKey: "statistics", icon: "chart", roles: ["admin", "gestionnaire"] },
  { to: "/utilisateurs", labelKey: "users", icon: "settings", roles: ["admin", "gestionnaire"] },
  { to: "/messages", labelKey: "messages", icon: "message", roles: ["admin", "gestionnaire", "prof"] },
  { to: "/corbeille", labelKey: "trash", icon: "trash", roles: ["admin", "gestionnaire"] },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14 17.5V16C14 14.3431 12.6569 13 11 13H5C3.34315 13 2 14.3431 2 16V17.5M18 17.5V16C18 14.79 17.21 13.76 16.12 13.42M12.62 2.58C13.7 2.93 14.49 3.96 14.49 5.16C14.49 6.36 13.7 7.39 12.62 7.74M11 5C11 6.65685 9.65685 8 8 8C6.34315 8 5 6.65685 5 5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.67 5L7.5 14.17L3.33 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  book: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 15.5V4.5C2 3.67 2.67 3 3.5 3H16.5C17.33 3 18 3.67 18 4.5V15.5C18 16.33 17.33 17 16.5 17H3.5C2.67 17 2 16.33 2 15.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 3V17M2 8H18" stroke="currentColor" strokeWidth="1.5"/></svg>,
  card: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8H18" stroke="currentColor" strokeWidth="1.5"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 16V9M7 16V5M12 16V11M17 16V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M3.93 3.93L5.34 5.34M14.66 14.66L16.07 16.07M3.93 16.07L5.34 14.66M14.66 5.34L16.07 3.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  message: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M18 10C18 14.42 14.42 18 10 18C8.57 18 7.22 17.64 6.04 17L2 18L3 14C2.36 12.81 2 11.45 2 10C2 5.58 5.58 2 10 2C14.42 2 18 5.58 18 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2.5 5H17.5M7.5 5V3.33C7.5 2.6 8.1 2 8.83 2H11.17C11.9 2 12.5 2.6 12.5 3.33V5M8.33 9.17V14.17M11.67 9.17V14.17M4.17 5L5 16.67C5 17.4 5.6 18 6.33 18H13.67C14.4 18 15 17.4 15 16.67L15.83 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  sun: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M4.22 15.78L5.64 14.36M14.36 5.64L15.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  moon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M17.5 10.5C17.5 14.64 14.14 18 10 18C5.86 18 2.5 14.64 2.5 10.5C2.5 6.36 5.86 3 10 3C10.28 3 10.56 3.02 10.83 3.05C9.47 4.22 8.6 5.96 8.6 7.9C8.6 11.48 11.52 14.4 15.1 14.4C15.93 14.4 16.72 14.25 17.45 13.97C17.48 14.14 17.5 14.32 17.5 14.5V10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8H14M8 2C6 4 6 12 8 14M8 2C10 4 10 12 8 14" stroke="currentColor" strokeWidth="1.5"/></svg>,
};

export default function AdminLayout() {
  const { logout, user, onlineUsers } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  // Stocker le mode par utilisateur dans localStorage
  const storageKey = user?.uid ? `profMode_${user.uid}` : null;
  const [profMode, setProfMode] = useState(() => {
    if (storageKey) return localStorage.getItem(storageKey) === "true";
    return false;
  });

  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, profMode.toString());
  }, [profMode, storageKey]);

  useEffect(() => {
    if (storageKey) setProfMode(localStorage.getItem(storageKey) === "true");
  }, [user?.uid, storageKey]);

  const actualRole = (user?.role === "admin" || user?.role === "gestionnaire") ? user.role : "prof";
  const userRole = ((actualRole === "admin" || actualRole === "gestionnaire") && profMode) ? "prof" : actualRole;
  const isProf = userRole === "prof";
  const canSwitchMode = actualRole === "admin" || actualRole === "gestionnaire";
  const canSeeOnlineUsers = user?.role === "admin" || user?.role === "gestionnaire";

  const onlineCount = onlineUsers.filter(u => u.isOnline).length;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole as "admin" | "gestionnaire" | "prof"));
  const sidebarWidth = 260;

  // Theme colors
  const colors = isDark ? {
    bg: "#0f172a",
    bgCard: "#1e293b",
    bgHover: "#334155",
    border: "#334155",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    accent: isProf ? "#10b981" : "#6366f1",
    accentBg: isProf ? "#064e3b" : "#312e81",
  } : {
    bg: "#f8fafc",
    bgCard: "#ffffff",
    bgHover: "#f1f5f9",
    border: "#e2e8f0",
    text: "#1e293b",
    textMuted: "#64748b",
    accent: isProf ? "#10b981" : "#6366f1",
    accentBg: isProf ? "#ecfdf5" : "#eef2ff",
  };

  const getRoleLabel = (role: string) => {
    if (role === "admin") return t("admin");
    if (role === "gestionnaire") return t("gestionnaire");
    if (role === "prof") return t("prof");
    return role;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg }}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 60,
          background: colors.bgCard, borderBottom: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 4 }}>
              {icons.menu}
            </button>
            <div style={{ width: 32, height: 32, background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>E</span>
            </div>
            <span style={{ fontWeight: 600, color: colors.text, fontSize: 16 }}>EDUTRACK</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 4 }}>
              {isDark ? icons.sun : icons.moon}
            </button>
          </div>
        </header>
      )}

      {/* Overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 55 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth, background: colors.bgCard, borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column", position: "fixed", top: 0,
        left: isMobile ? (sidebarOpen ? 0 : -sidebarWidth) : 0, bottom: 0, zIndex: 60,
        transition: "left 0.3s ease-in-out", boxShadow: isMobile && sidebarOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>E</span>
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>EDUTRACK</h1>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>{isProf ? t("professorSpace") : t("schoolManagement")}</p>
              </div>
            </div>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 4 }}>
                {icons.close}
              </button>
            )}
          </div>

          {/* Theme & Language Toggle */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={toggleTheme} style={{ flex: 1, padding: "8px", background: colors.bgHover, border: `1px solid ${colors.border}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: colors.textMuted, fontSize: 12 }}>
              {isDark ? icons.sun : icons.moon}
              {isDark ? t("lightMode") : t("darkMode")}
            </button>
            <button onClick={() => setLanguage(language === "fr" ? "en" : "fr")} style={{ padding: "8px 12px", background: colors.bgHover, border: `1px solid ${colors.border}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textMuted, fontSize: 12 }}>
              {icons.globe}
              {language.toUpperCase()}
            </button>
          </div>

          {canSwitchMode && (
            <button onClick={() => setProfMode(!profMode)} style={{ marginTop: 12, width: "100%", padding: "10px 14px", background: profMode ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {profMode ? t("adminMode") : t("profMode")}
            </button>
          )}

          {/* Online Users Toggle */}
          {canSeeOnlineUsers && (
            <button onClick={() => setShowOnlineUsers(!showOnlineUsers)} style={{ marginTop: 8, width: "100%", padding: "10px 14px", background: colors.bgHover, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: colors.text }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                {t("connectedUsers")}
              </span>
              <span style={{ background: "#10b981", color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>{onlineCount}</span>
            </button>
          )}

          {/* Online Users List */}
          {showOnlineUsers && canSeeOnlineUsers && (
            <div style={{ marginTop: 8, maxHeight: 150, overflowY: "auto", background: colors.bgHover, borderRadius: 8, padding: 8 }}>
              {onlineUsers.filter(u => u.isOnline).map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: 11, color: colors.text, flex: 1 }}>{u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email.split("@")[0]}</span>
                  <span style={{ fontSize: 10, color: colors.textMuted }}>{getRoleLabel(u.role)}</span>
                </div>
              ))}
              {onlineCount === 0 && <p style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", margin: 8 }}>{t("noData")}</p>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filteredNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                fontSize: 14, fontWeight: 500, color: isActive ? colors.accent : colors.textMuted,
                background: isActive ? colors.accentBg : "transparent", textDecoration: "none", transition: "all 0.15s"
              })}>
                <span style={{ display: "flex", alignItems: "center" }}>{icons[item.icon]}</span>
                {t(item.labelKey as any)}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ padding: 16, background: colors.bgHover, borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                {user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.email?.split("@")[0] || "Utilisateur"}
                </p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{getRoleLabel(isProf ? "prof" : (user?.role || ""))}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <NavLink to="/profil" style={{ flex: 1, padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, textDecoration: "none", textAlign: "center" }}>
                {t("profile")}
              </NavLink>
              <button onClick={handleLogout} style={{ flex: 1, padding: "10px", background: isDark ? "#7f1d1d" : "#fef2f2", border: `1px solid ${isDark ? "#991b1b" : "#fecaca"}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: isDark ? "#fca5a5" : "#dc2626", cursor: "pointer" }}>
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, marginTop: isMobile ? 60 : 0, minHeight: isMobile ? "calc(100vh - 60px)" : "100vh", transition: "margin-left 0.3s ease-in-out" }}>
        <div style={{ padding: isMobile ? 16 : 32, maxWidth: 1400, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
