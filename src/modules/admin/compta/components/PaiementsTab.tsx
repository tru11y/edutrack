import type { Paiement } from "../../../paiements/paiement.types";
import type { useTheme } from "../../../../context/ThemeContext";

function formatMontant(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

function formatDate(d: string): string {
  if (!d) return "-";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
  return d;
}

export default function PaiementsTab({
  paiements,
  colors,
}: {
  paiements: Paiement[];
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (paiements.length === 0) {
    return (
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun paiement pour ce mois</p>
      </div>
    );
  }

  const totalPaye = paiements.reduce((s, p) => s + (p.montantPaye || 0), 0);
  const totalAttendu = paiements.reduce((s, p) => s + (p.montantTotal || 0), 0);

  return (
    <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
          {paiements.length} paiement{paiements.length > 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          {formatMontant(totalPaye)} / {formatMontant(totalAttendu)}
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: colors.bgSecondary }}>
              {["Eleve", "Mois", "Total", "Paye", "Restant", "Statut"].map((h) => (
                <th key={h} style={{ padding: "12px 20px", textAlign: h === "Eleve" ? "left" : "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>{p.eleveNom}</td>
                <td style={{ padding: "14px 20px", textAlign: "right", color: colors.textMuted, fontSize: 14 }}>{formatDate(p.mois)}</td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 500, color: colors.text, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{formatMontant(p.montantTotal)}</td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 500, color: colors.success, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{formatMontant(p.montantPaye)}</td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 500, color: p.montantRestant > 0 ? colors.danger : colors.textMuted, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{formatMontant(p.montantRestant)}</td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg,
                    color: p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger,
                  }}>
                    {p.statut === "paye" ? "Paye" : p.statut === "partiel" ? "Partiel" : "Impaye"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
