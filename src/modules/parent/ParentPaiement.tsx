import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getPaiementsByEleve } from "../paiements/paiement.service";
import { exportRecuPaiementPDF } from "../paiements/paiement.pdf";
import type { Paiement } from "../paiements/paiement.types";

export default function ParentPaiements() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.eleveId && (!user?.enfantsIds || user.enfantsIds.length === 0)) {
      setLoading(false);
      return;
    }

    const eleveId = user?.eleveId || user?.enfantsIds?.[0];
    if (!eleveId) {
      setLoading(false);
      return;
    }

    getPaiementsByEleve(eleveId).then((p) => {
      setPaiements(p);
      setLoading(false);
    });
  }, [user]);

  const stats = {
    total: paiements.reduce((acc, p) => acc + (p.montantTotal || 0), 0),
    paye: paiements.reduce((acc, p) => acc + (p.montantPaye || 0), 0),
    reste: paiements.reduce((acc, p) => acc + (p.montantRestant || 0), 0)
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.success,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement des paiements...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>Paiements</h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Historique et recus de paiement</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 20
        }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>Total du</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
            {stats.total.toLocaleString("fr-FR")} F
          </p>
        </div>
        <div style={{
          background: colors.successBg,
          borderRadius: 16,
          border: `1px solid ${colors.success}40`,
          padding: 20
        }}>
          <p style={{ fontSize: 13, color: colors.success, marginBottom: 4 }}>Deja paye</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0 }}>
            {stats.paye.toLocaleString("fr-FR")} F
          </p>
        </div>
        <div style={{
          background: stats.reste > 0 ? colors.dangerBg : colors.bg,
          borderRadius: 16,
          border: `1px solid ${stats.reste > 0 ? colors.danger : colors.border}`,
          padding: 20
        }}>
          <p style={{ fontSize: 13, color: stats.reste > 0 ? colors.danger : colors.textMuted, marginBottom: 4 }}>Reste a payer</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: stats.reste > 0 ? colors.danger : colors.textMuted, margin: 0 }}>
            {stats.reste.toLocaleString("fr-FR")} F
          </p>
        </div>
      </div>

      {/* List */}
      {paiements.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 60,
          textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, background: colors.bgSecondary, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3.5" y="7" width="21" height="14" rx="2" stroke={colors.textLight} strokeWidth="2"/>
              <path d="M3.5 11.5H24.5" stroke={colors.textLight} strokeWidth="2"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun paiement enregistre</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paiements.map((p) => (
            <div
              key={p.id}
              style={{
                background: colors.bgCard,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                padding: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke={p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger} strokeWidth="2"/>
                    <path d="M2 10H22" stroke={p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger} strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>{p.mois}</p>
                  <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                    Total: {(p.montantTotal || 0).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: colors.success, margin: 0 }}>
                    {(p.montantPaye || 0).toLocaleString("fr-FR")} F
                  </p>
                  {(p.montantRestant || 0) > 0 && (
                    <p style={{ fontSize: 12, color: colors.danger, margin: 0 }}>
                      Reste: {p.montantRestant.toLocaleString("fr-FR")} F
                    </p>
                  )}
                </div>

                <StatusBadge statut={p.statut} />

                <button
                  onClick={() =>
                    exportRecuPaiementPDF(p, {
                      eleveNom: user?.email?.split("@")[0] || "Eleve",
                      elevePrenom: "",
                      classe: "N/A",
                    })
                  }
                  style={{
                    padding: "10px 16px",
                    background: colors.bgSecondary,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: colors.textSecondary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10V12.67C14 13.03 13.86 13.38 13.61 13.64C13.36 13.89 13.02 14.03 12.67 14.03H3.33C2.98 14.03 2.64 13.89 2.39 13.64C2.14 13.38 2 13.03 2 12.67V10M4.67 6.67L8 10M8 10L11.33 6.67M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Recu PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ statut }: { statut: "paye" | "partiel" | "impaye" }) {
  const { colors } = useTheme();
  const config = {
    paye: { label: "Paye", bg: colors.successBg, color: colors.success },
    partiel: { label: "Partiel", bg: colors.warningBg, color: colors.warning },
    impaye: { label: "Impaye", bg: colors.dangerBg, color: colors.danger },
  };

  const { label, bg, color } = config[statut] || config.impaye;

  return (
    <span style={{
      display: "inline-block",
      padding: "6px 12px",
      background: bg,
      color: color,
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600
    }}>
      {label}
    </span>
  );
}
