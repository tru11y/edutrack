import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>
          <span style={{ color: "#6366f1" }}>Edu</span>Track
        </h1>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/pricing" style={{ color: "#6b7280", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Tarifs</a>
          <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
            Connexion
          </button>
          <button onClick={() => navigate("/signup")} style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff" }}>
            Commencer gratuitement
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ padding: "80px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ fontSize: 48, fontWeight: 800, color: "#111", lineHeight: 1.2, marginBottom: 16 }}>
          La plateforme de gestion scolaire <span style={{ color: "#6366f1" }}>complete</span>
        </h2>
        <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.6, marginBottom: 32 }}>
          Gerez eleves, presences, paiements, notes et bien plus.
          Une seule plateforme pour toute votre ecole.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => navigate("/signup")} style={{ padding: "14px 32px", background: "#6366f1", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff" }}>
            Essayer gratuitement
          </button>
          <button onClick={() => navigate("/pricing")} style={{ padding: "14px 32px", background: "transparent", border: "2px solid #d1d5db", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 500, color: "#374151" }}>
            Voir les tarifs
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <h3 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", color: "#111", marginBottom: 40 }}>
          Tout ce dont votre ecole a besoin
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "👥", title: "Gestion des eleves", desc: "Inscriptions, fiches completes, suivi individuel." },
            { icon: "📋", title: "Presences & Cahier", desc: "Appel numerique, cahier de texte collaboratif." },
            { icon: "💰", title: "Paiements", desc: "Suivi des mensualites, versements, relances." },
            { icon: "📊", title: "Notes & Bulletins", desc: "Evaluations, moyennes, bulletins automatiques." },
            { icon: "📅", title: "Emploi du temps", desc: "Planification, detection des conflits." },
            { icon: "🔔", title: "Notifications", desc: "Alertes push, emails, notifications en temps reel." },
            { icon: "📈", title: "Analytics", desc: "Tableaux de bord avances, rapports detailles." },
            { icon: "🎓", title: "Admissions", desc: "Formulaire public, pipeline de candidatures." },
            { icon: "🚌", title: "Transport", desc: "Routes, arrets, affectation des eleves." },
          ].map((f) => (
            <div key={f.title} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
              <span style={{ fontSize: 32 }}>{f.icon}</span>
              <h4 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: "12px 0 8px" }}>{f.title}</h4>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 40px", textAlign: "center", background: "#6366f1", color: "#fff" }}>
        <h3 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Pret a transformer votre ecole?</h3>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24 }}>Commencez gratuitement, pas de carte bancaire requise.</p>
        <button onClick={() => navigate("/signup")} style={{ padding: "14px 32px", background: "#fff", color: "#6366f1", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
          Creer mon ecole
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px 40px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
        EduTrack © 2026. Tous droits reserves.
      </footer>
    </div>
  );
}
