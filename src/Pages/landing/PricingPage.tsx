import { useNavigate } from "react-router-dom";
import { PLANS } from "../../constants/plans";

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <h1 onClick={() => navigate("/landing")} style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0, cursor: "pointer" }}>
          <span style={{ color: "#6366f1" }}>Edu</span>Track
        </h1>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
            Connexion
          </button>
          <button onClick={() => navigate("/signup")} style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff" }}>
            Commencer
          </button>
        </nav>
      </header>

      <section style={{ padding: "60px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", color: "#111", marginBottom: 8 }}>
          Choisissez votre plan
        </h2>
        <p style={{ fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 40 }}>
          Commencez gratuitement, evoluez selon vos besoins.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => {
            const isPro = plan.id === "pro";
            return (
              <div key={plan.id} style={{
                background: "#fff", border: `2px solid ${isPro ? "#6366f1" : "#e5e7eb"}`,
                borderRadius: 16, padding: 28, position: "relative",
                boxShadow: isPro ? "0 4px 24px rgba(99, 102, 241, 0.15)" : "none",
              }}>
                {isPro && (
                  <span style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    padding: "4px 16px", background: "#6366f1", color: "#fff", fontSize: 11,
                    fontWeight: 700, borderRadius: 20, whiteSpace: "nowrap",
                  }}>
                    Populaire
                  </span>
                )}

                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "8px 0" }}>{plan.name}</h3>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#111", margin: "8px 0" }}>
                  {plan.price === 0 ? "0€" : `${plan.price}€`}
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af" }}>/mois</span>
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                  {plan.maxEleves === Infinity ? "Eleves illimites" : `Jusqu'a ${plan.maxEleves} eleves`}
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: 13, color: "#374151", padding: "6px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: "#22c55e", fontSize: 14, lineHeight: "18px" }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => navigate("/signup")} style={{
                  width: "100%", padding: "12px", border: "none", borderRadius: 10, cursor: "pointer",
                  fontSize: 14, fontWeight: 600,
                  background: isPro ? "#6366f1" : "#f3f4f6",
                  color: isPro ? "#fff" : "#374151",
                }}>
                  {plan.price === 0 ? "Commencer gratuitement" : "Choisir ce plan"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
