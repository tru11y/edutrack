import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-8">EDUTRACK</h2>

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
          className="mt-6 text-left text-sm text-red-600 hover:underline"
        >
          🚪 Déconnexion
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
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg text-sm font-medium transition ${
          isActive
            ? "bg-black text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
