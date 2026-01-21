import { Outlet, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ProfLayout() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--text)", transition: "background-color 0.3s ease, color 0.3s ease" }}>
      <aside style={{ background: "var(--card)", padding: 20, borderRight: "1px solid var(--border)" }}>
        <h3>EDUTRACK</h3>

        <nav style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <Nav to="/prof" label="Mes cours" />
        </nav>

        {/* Toggle thème */}
        <button
          onClick={() => setIsDark((v) => !v)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginTop: 20,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: "var(--primary-soft)",
            color: "var(--text)",
            transition: "background 0.2s"
          }}
        >
          {isDark ? "☀️ Mode clair" : "🌙 Mode sombre"}
        </button>
      </aside>

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
        padding: "8px 12px",
        borderRadius: 8,
        background: isActive ? "#f0f0f0" : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}
