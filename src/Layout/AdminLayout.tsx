import { Outlet, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  // 🌗 Thème clair / sombre
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        transition: "background-color 0.3s ease, color 0.3s ease"
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "16rem",
          padding: "1.5rem",
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          color: "var(--text)"
        }}
      >
        {/* LOGO */}
        <h1 className="text-xl font-bold mb-8">🎓 EDUTRACK</h1>

        {/* NAV */}
        <nav className="flex flex-col gap-3">

          <NavItem to="/admin" label="Dashboard" />
          <NavItem to="/admin/eleves" label="Élèves" />
          <NavItem to="/admin/professeurs" label="Professeurs" />
          <NavItem to="/admin/cours" label="Cours" />
          <NavItem to="/admin/paiements" label="Paiements" />
          <NavItem to="/admin/bans" label="Bannis" />

        </nav>

        {/* FOOTER SIDEBAR */}
        <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

        {/* Toggle thème */}
          <button
            onClick={() => setIsDark((v) => !v)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: "500",
              border: "none",
              cursor: "pointer",
              backgroundColor: "var(--primary-soft)",
              color: "var(--text)",
              transition: "background-color 0.2s ease"
            }}
          >
            {isDark ? "☀️ Mode clair" : "🌙 Mode sombre"}
          </button>

        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

/* ======================
   NAV ITEM
====================== */

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded font-medium transition ${
          isActive
            ? "bg-black text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
