import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { t, setLang } from "../i18n";

export default function AdminLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          padding: 24,
        }}
      >
        <h2 style={{ marginBottom: 24 }}>EDUTRACK</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NavItem to="/admin" label={t("dashboard")} />
          <NavItem to="/admin/eleves" label={t("students")} />
          <NavItem to="/admin/professeurs" label="Professeurs" />
          <NavItem to="/admin/cours" label="Cours" />
          <NavItem to="/admin/paiements" label={t("payments")} />
        </nav>

        <div style={{ marginTop: 32, display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={() => setLang("fr")}>
            FR
          </button>
          <button className="btn secondary" onClick={() => setLang("en")}>
            EN
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ background: "var(--bg)" }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "10px 12px",
        borderRadius: 10,
        background: isActive ? "#f0f0f0" : "transparent",
        fontWeight: 500,
        display: "block",
      })}
    >
      {label}
    </NavLink>
  );
}
