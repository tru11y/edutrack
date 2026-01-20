import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ParentLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <h2 className="text-lg font-bold">👪 Portail Parent</h2>

        <nav className="space-y-2 text-sm">
          <Link to="/parent" className="block hover:underline">
            🏠 Dashboard
          </Link>
          <Link to="/parent/presences" className="block hover:underline">
            📋 Présences
          </Link>
          <Link to="/parent/cahier" className="block hover:underline">
            📘 Cahier de texte
          </Link>
          <Link to="/parent/paiements" className="block hover:underline">
            💰 Paiements
          </Link>
        </nav>

        <button
          onClick={logout}
          className="mt-6 bg-red-600 px-3 py-1 rounded text-sm"
        >
          Déconnexion
        </button>
      </aside>

      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
