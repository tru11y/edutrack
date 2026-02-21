import { useTenant } from "../context/TenantContext";
import { useTheme } from "../context/ThemeContext";
import { PLANS } from "../constants/plans";

export default function SubscriptionBanner() {
  const { subscription } = useTenant();
  const { colors } = useTheme();

  if (!subscription) return null;

  const plan = PLANS.find((p) => p.id === subscription.plan);
  if (!plan) return null;

  // Only show banner for free plan
  if (subscription.plan !== "free") return null;

  return (
    <div style={{
      padding: "10px 20px", background: `${colors.warning}15`,
      border: `1px solid ${colors.warning}40`, borderRadius: 10, marginBottom: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13,
    }}>
      <span style={{ color: colors.text }}>
        Plan gratuit — Limite a {plan.maxEleves} eleves.{" "}
        <a href="/billing" style={{ color: colors.primary, fontWeight: 500 }}>Passer au plan superieur</a>
      </span>
    </div>
  );
}
