import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen" style={{ background: colors.bg }}>
      {/* Sidebar */}
      <aside
        className="w-64 p-6 flex flex-col"
        style={{
          background: colors.bgCard,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <h2 className="text-xl font-semibold mb-8" style={{ color: colors.text }}>
          EDUTRACK
        </h2>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem to="/admin">Dashboard</NavItem>
          <NavItem to="/admin/eleves">Élèves</NavItem>
          <NavItem to="/admin/professeurs">Professeurs</NavItem>
          <NavItem to="/admin/cours">Cours</NavItem>
          <NavItem to="/admin/paiements">Paiements</NavItem>
          <NavItem to="/admin/cahier">Cahier de texte</NavItem>
          <NavItem to="/admin/discipline">Discipline</NavItem>
        </nav>

        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="mt-6 text-left text-sm hover:underline"
          style={{ color: colors.danger }}
        >
          Déconnexion
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <NavLink
      to={to}
      className="px-4 py-2 rounded-lg text-sm font-medium transition"
      style={({ isActive }) => ({
        background: isActive ? colors.primary : "transparent",
        color: isActive ? "#fff" : colors.textSecondary,
      })}
    >
      {children}
    </NavLink>
  );
}
