import { useTheme } from "../../context/ThemeContext";
import type { Bulletin } from "./notes.types";
import { exportBulletinPDF } from "./bulletin.pdf";

interface BulletinViewProps {
  bulletin: Bulletin;
  eleveNom?: string;
}

export default function BulletinView({ bulletin, eleveNom }: BulletinViewProps) {
  const { colors } = useTheme();

  const getMoyenneColor = (moy: number) => {
    if (moy >= 14) return colors.success;
    if (moy >= 10) return colors.primary;
    if (moy >= 8) return colors.warning;
    return colors.danger;
  };

  const matieres = Object.entries(bulletin.moyennesMatiere || {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div style={{
      background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: `2px solid ${colors.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>
            Bulletin - Trimestre {bulletin.trimestre}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>
            {bulletin.classe} — {bulletin.anneeScolaire}
            {eleveNom && ` — ${eleveNom}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            padding: "8px 16px", borderRadius: 8, textAlign: "center",
            background: `${getMoyenneColor(bulletin.moyenneGenerale)}15`,
          }}>
            <div style={{ fontSize: 11, color: colors.textMuted }}>Moyenne</div>
            <div style={{
              fontSize: 20, fontWeight: 700, color: getMoyenneColor(bulletin.moyenneGenerale),
            }}>
              {bulletin.moyenneGenerale}/20
            </div>
          </div>
          {bulletin.rang > 0 && (
            <div style={{
              padding: "8px 16px", borderRadius: 8, textAlign: "center",
              background: colors.primaryBg,
            }}>
              <div style={{ fontSize: 11, color: colors.textMuted }}>Rang</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.primary }}>
                {bulletin.rang}/{bulletin.totalEleves}
              </div>
            </div>
          )}
          <button
            onClick={() => exportBulletinPDF(bulletin, eleveNom || "Eleve")}
            style={{
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${colors.border}`,
              background: colors.bgHover, color: colors.text, cursor: "pointer", fontSize: 13,
            }}
          >
            PDF
          </button>
        </div>
      </div>

      {/* Matieres */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 13, fontWeight: 600, color: colors.textMuted }}>Matiere</th>
            <th style={{ padding: "10px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, color: colors.textMuted }}>Moyenne</th>
          </tr>
        </thead>
        <tbody>
          {matieres.map(([matiere, moy]) => (
            <tr key={matiere} style={{ borderBottom: `1px solid ${colors.border}` }}>
              <td style={{ padding: "10px 20px", fontSize: 14, color: colors.text }}>{matiere}</td>
              <td style={{ padding: "10px 20px", textAlign: "center" }}>
                <span style={{
                  fontWeight: 600, fontSize: 14,
                  color: getMoyenneColor(moy),
                }}>
                  {moy}/20
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{
        padding: "16px 20px", borderTop: `1px solid ${colors.border}`,
        display: "flex", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 13, color: colors.textMuted }}>
          Absences: <span style={{ fontWeight: 600, color: colors.danger }}>{bulletin.absencesTotal}</span>
        </div>
        <div style={{ fontSize: 13, color: colors.textMuted }}>
          Retards: <span style={{ fontWeight: 600, color: colors.warning }}>{bulletin.retardsTotal}</span>
        </div>
        {bulletin.appreciationGenerale && (
          <div style={{ fontSize: 13, color: colors.text, flex: 1 }}>
            Appreciation: <em>{bulletin.appreciationGenerale}</em>
          </div>
        )}
      </div>
    </div>
  );
}
