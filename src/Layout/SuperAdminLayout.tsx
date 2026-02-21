import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function SuperAdminLayout() {
  const { logout, user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/superadmin", label: "Dashboard", icon: "📊", end: true },
    { to: "/superadmin/schools", label: "Ecoles", icon: "🏫" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg }}>
      <aside style={{
        width: 260, background: colors.bgCard, borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0,
      }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${colors.border}` }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>EduTrack</h1>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 0" }}>Super Administration</p>
        </div>

        <nav style={{ flex: 1, padding: "20px 12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                fontSize: 14, fontWeight: 500, color: isActive ? colors.primary : colors.textMuted,
                background: isActive ? colors.primaryBg : "transparent", textDecoration: "none",
              })}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ padding: 16, background: colors.bgHover, borderRadius: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>
              {user?.email?.split("@")[0] || "Super Admin"}
            </p>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 12px" }}>Super Admin</p>
            <div style={{ display: "flex", gap: 8 }}>
              <NavLink to="/" style={{ flex: 1, padding: 10, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textMuted, textDecoration: "none", textAlign: "center" }}>
                App
              </NavLink>
              <button onClick={handleLogout} style={{ flex: 1, padding: 10, background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.danger, cursor: "pointer" }}>
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, minHeight: "100vh" }}>
        <div style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
