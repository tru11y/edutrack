import { Outlet, NavLink } from "react-router-dom";
import { t, setLang } from "../i18n";
import "../design/components.css";

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
          <Nav to="/admin" label={t("dashboard")} />
          <Nav to="/admin/eleves" label={t("students")} />
          <Nav to="/admin/professeurs" label="Professeurs" />
          <Nav to="/admin/cours" label="Cours" />
          <Nav to="/admin/paiements" label={t("payments")} />
        </nav>

        <div style={{ marginTop: 32 }}>
          <button className="btn secondary" onClick={() => setLang("fr")}>
            FR
          </button>{" "}
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

function Nav({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "10px 12px",
        borderRadius: 10,
        background: isActive ? "#f0f0f0" : "transparent",
        fontWeight: 500,
      })}
    >
      {label}
    </NavLink>
  );
}
