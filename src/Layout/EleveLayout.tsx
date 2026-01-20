import { Outlet, NavLink } from "react-router-dom";

export default function EleveLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 20, borderRight: "1px solid var(--border)" }}>
        <h3>EDUTRACK</h3>

        <nav style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <Nav to="/eleve" label="Vue générale" />
          <Nav to="/eleve/emploi-du-temps" label="Emploi du temps" />
          <Nav to="/eleve/presences" label="Présences" />
          <Nav to="/eleve/paiements" label="Paiements" />
        </nav>
      </aside>

      <main style={{ padding: 24 }}>
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
        padding: "8px 12px",
        borderRadius: 8,
        background: isActive ? "#f0f0f0" : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}
