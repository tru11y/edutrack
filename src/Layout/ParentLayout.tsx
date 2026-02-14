import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function ParentLayout() {
  const { logout, user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg }}>
      <aside style={{
        width: 260,
        background: colors.bgCard,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px"
      }}>
        <div style={{ padding: "0 12px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>EDUTRACK</h1>
          <span style={{
            display: "inline-block",
            marginTop: 8,
            padding: "4px 10px",
            background: colors.success,
            color: colors.bgCard,
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500
          }}>
            Parent
          </span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <NavItem to="/parent" end label="Tableau de bord" colors={colors} />
          <NavItem to="/parent/presences" label="Presences" colors={colors} />
          <NavItem to="/parent/cahier" label="Cahier de texte" colors={colors} />
          <NavItem to="/parent/paiements" label="Paiements" colors={colors} />
        </nav>

        <div style={{
          padding: 16,
          background: colors.bgSecondary,
          borderRadius: 12,
          marginTop: 16
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 }}>
            {user?.email?.split("@")[0]}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: colors.text,
              cursor: "pointer"
            }}
          >
            Deconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label, end, colors }: { to: string; label: string; end?: boolean; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "block",
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        color: isActive ? colors.bgCard : colors.text,
        background: isActive ? colors.primary : "transparent",
        textDecoration: "none"
      })}
    >
      {label}
    </NavLink>
  );
}
