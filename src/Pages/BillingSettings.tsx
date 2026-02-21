import { useTheme } from "../context/ThemeContext";
import { useTenant } from "../context/TenantContext";
import { PLANS } from "../constants/plans";
import { httpsCallable } from "firebase/functions";
import { functions } from "../services/firebase";

export default function BillingSettings() {
  const { colors } = useTheme();
  const { subscription } = useTenant();
  const currentPlan = subscription?.plan || "free";

  const handleUpgrade = async (priceId: string) => {
    try {
      const fn = httpsCallable(functions, "createCheckoutSession");
      const result = await fn({
        priceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`,
      });
      const data = result.data as { url: string };
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors de la creation de la session de paiement.");
    }
  };

  const handleManage = async () => {
    try {
      const fn = httpsCallable(functions, "createBillingPortalSession");
      const result = await fn({ returnUrl: `${window.location.origin}/billing` });
      const data = result.data as { url: string };
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors de l'ouverture du portail.");
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Abonnement</h1>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Gerez votre plan et votre facturation.</p>

      {subscription?.stripeSubscriptionId && (
        <div style={{ marginBottom: 24 }}>
          <button onClick={handleManage} style={{
            padding: "10px 20px", background: colors.bgHover, border: `1px solid ${colors.border}`,
            borderRadius: 8, cursor: "pointer", color: colors.text, fontSize: 14, fontWeight: 500,
          }}>
            Gerer l'abonnement sur Stripe
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = PLANS.indexOf(plan) > PLANS.findIndex((p) => p.id === currentPlan);

          return (
            <div key={plan.id} style={{
              background: colors.bgCard, border: `2px solid ${isCurrent ? colors.primary : colors.border}`,
              borderRadius: 12, padding: 24, position: "relative",
            }}>
              {isCurrent && (
                <span style={{
                  position: "absolute", top: -12, left: 16, padding: "2px 12px",
                  background: colors.primary, color: "#fff", fontSize: 11, fontWeight: 600,
                  borderRadius: 6,
                }}>
                  Plan actuel
                </span>
              )}

              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "8px 0" }}>{plan.name}</h3>
              <p style={{ fontSize: 32, fontWeight: 700, color: colors.primary, margin: "8px 0" }}>
                {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                {plan.price > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: colors.textMuted }}>/mois</span>}
              </p>
              <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>
                {plan.maxEleves === Infinity ? "Eleves illimites" : `Jusqu'a ${plan.maxEleves} eleves`}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: colors.text, padding: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: colors.success }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {isUpgrade && plan.stripePriceId && (
                <button onClick={() => handleUpgrade(plan.stripePriceId!)} style={{
                  width: "100%", padding: "10px", background: colors.primary, color: "#fff",
                  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
                }}>
                  Passer a {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
