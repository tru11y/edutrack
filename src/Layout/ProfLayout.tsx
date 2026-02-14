import { Outlet, NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function ProfLayout() {
  const { colors, toggleTheme, isDark } = useTheme();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, transition: "background-color 0.3s ease, color 0.3s ease" }}>
      <aside style={{ background: colors.bgCard, padding: 20, borderRight: `1px solid ${colors.border}` }}>
        <h3 style={{ color: colors.text }}>EDUTRACK</h3>

        <nav style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <Nav to="/prof" label="Mes cours" />
        </nav>

        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginTop: 20,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: colors.primaryBg,
            color: colors.text,
            transition: "background 0.2s"
          }}
        >
          {isDark ? "Mode clair" : "Mode sombre"}
        </button>
      </aside>

      <main style={{ background: colors.bg }}>
        <Outlet />
      </main>
    </div>
  );
}

function Nav({ to, label }: { to: string; label: string }) {
  const { colors } = useTheme();
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "8px 12px",
        borderRadius: 8,
        background: isActive ? colors.bgSecondary : "transparent",
        color: isActive ? colors.text : colors.textSecondary,
        textDecoration: "none",
      })}
    >
      {label}
    </NavLink>
  );
}
