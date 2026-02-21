import type { ReactNode } from "react";
import { useFeatureGate } from "../hooks/useFeatureGate";
import { useTheme } from "../context/ThemeContext";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, getRequiredPlan } = useFeatureGate();
  const { colors } = useTheme();

  if (hasFeature(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const requiredPlan = getRequiredPlan(feature);

  return (
    <div style={{
      padding: 40, textAlign: "center", background: colors.bgCard,
      border: `1px solid ${colors.border}`, borderRadius: 12,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 8 }}>
        Fonctionnalite non disponible
      </h3>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
        Cette fonctionnalite necessite le plan <strong style={{ textTransform: "capitalize" }}>{requiredPlan}</strong> ou superieur.
      </p>
      <a href="/billing" style={{
        display: "inline-block", padding: "10px 24px", background: colors.primary,
        color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 500, fontSize: 14,
      }}>
        Mettre a niveau
      </a>
    </div>
  );
}
