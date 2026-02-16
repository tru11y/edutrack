import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getDetailedStatsSecure,
  getCloudFunctionErrorMessage,
  type EleveStatDetail,
  type DetailedStatsGlobal,
} from "../services/cloudFunctions";
import { exportToCSV } from "../utils/csvExport";

export default function Stats() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [global, setGlobal] = useState<DetailedStatsGlobal | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [statsEleves, setStatsEleves] = useState<EleveStatDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterClasse, setFilterClasse] = useState("");

  const loadStats = (classe?: string) => {
    setLoading(true);
    setError("");
    getDetailedStatsSecure({ classe })
      .then((res) => {
        setGlobal(res.global);
        setClasses(res.classes);
        setStatsEleves(res.eleves);
      })
      .catch((err) => setError(getCloudFunctionErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats(filterClasse || undefined);
  }, [filterClasse]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40,
            border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !global) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{
          background: colors.dangerBg, border: `1px solid ${colors.danger}40`,
          borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 420,
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: colors.danger, margin: "0 0 8px" }}>Erreur</p>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>{error || "Impossible de charger les statistiques."}</p>
        </div>
      </div>
    );
  }

  const tauxRecouvrement = global.totalPaiements > 0
    ? Math.round((global.totalPaye / global.totalPaiements) * 100)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.primary,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 20V10M9 20V4M15 20V14M21 20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Statistiques</h1>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Vue d'ensemble</p>
          </div>
        </div>
      </div>

      <StatsCards global={global} tauxRecouvrement={tauxRecouvrement} colors={colors} />

      <div style={{ marginBottom: 24, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          aria-label="Filtrer par classe"
          style={{
            padding: "12px 16px", border: `1px solid ${colors.border}`,
            borderRadius: 10, fontSize: 14, background: colors.bgInput,
            color: colors.text, minWidth: 200,
          }}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => exportToCSV(statsEleves, [
            { header: "Nom", accessor: (r) => r.nom },
            { header: "Prenom", accessor: (r) => r.prenom },
            { header: "Classe", accessor: (r) => r.classe },
            { header: "Presences", accessor: (r) => r.presences },
            { header: "Absences", accessor: (r) => r.absences },
            { header: "Retards", accessor: (r) => r.retards },
            { header: "Taux Presence (%)", accessor: (r) => r.tauxPresence },
            { header: "Paiement Total", accessor: (r) => r.paiementTotal },
            { header: "Paiement Paye", accessor: (r) => r.paiementPaye },
            { header: "Statut Paiement", accessor: (r) => r.paiementStatut },
          ], `statistiques_${filterClasse || "toutes"}.csv`)}
          style={{
            padding: "12px 20px", background: colors.bgSecondary, color: colors.textSecondary,
            borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.75 11.25V14.25C15.75 15.08 15.08 15.75 14.25 15.75H3.75C2.92 15.75 2.25 15.08 2.25 14.25V11.25M5.25 7.5L9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t("exportCSV")}
        </button>
      </div>

      <ElevesTable eleves={statsEleves} colors={colors} />
    </div>
  );
}

function StatsCards({
  global,
  tauxRecouvrement,
  colors,
}: {
  global: DetailedStatsGlobal;
  tauxRecouvrement: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const cards = [
    { label: "Eleves actifs", value: global.elevesActifs, bg: colors.bgCard, border: colors.border, color: colors.text },
    { label: "Appels", value: global.totalPresences, bg: colors.bgCard, border: colors.border, color: colors.text },
    { label: "Taux presence", value: `${global.tauxPresenceMoyen}%`, bg: colors.successBg, border: `${colors.success}40`, color: colors.success },
    { label: "Recouvrement", value: `${tauxRecouvrement}%`, bg: colors.warningBg, border: `${colors.warning}40`, color: colors.warning },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
      {cards.map((c) => (
        <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: 20, border: `1px solid ${c.border}` }}>
          <p style={{ fontSize: 13, color: c.color, margin: "0 0 8px" }}>{c.label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ElevesTable({
  eleves,
  colors,
}: {
  eleves: EleveStatDetail[];
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (eleves.length === 0) {
    return (
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun eleve</p>
      </div>
    );
  }

  return (
    <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: colors.bgSecondary }}>
            {["Eleve", "Classe", "Pres.", "Abs.", "Taux", "Paiements"].map((h) => (
              <th key={h} style={{
                padding: "14px 20px",
                textAlign: h === "Eleve" || h === "Classe" ? "left" : "center",
                fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {eleves.map((s) => (
            <tr key={s.eleveId} style={{ borderTop: `1px solid ${colors.border}` }}>
              <td style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: s.sexe === "M" ? colors.infoBg : colors.dangerBg,
                    color: s.sexe === "M" ? colors.info : colors.danger,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 600, fontSize: 12,
                  }}>
                    {s.prenom[0]}{s.nom[0]}
                  </div>
                  <p style={{ margin: 0, fontWeight: 500, color: colors.text }}>{s.prenom} {s.nom}</p>
                </div>
              </td>
              <td style={{ padding: "16px 20px", color: colors.textMuted, fontSize: 14 }}>{s.classe}</td>
              <td style={{ padding: "16px 20px", textAlign: "center" }}>
                <span style={{ color: colors.success, fontWeight: 500 }}>{s.presences}</span>
              </td>
              <td style={{ padding: "16px 20px", textAlign: "center" }}>
                <span style={{ color: colors.danger, fontWeight: 500 }}>{s.absences}</span>
              </td>
              <td style={{ padding: "16px 20px", textAlign: "center" }}>
                <PresenceBar taux={s.tauxPresence} colors={colors} />
              </td>
              <td style={{ padding: "16px 20px", textAlign: "center" }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: s.paiementStatut === "ok" ? colors.successBg : s.paiementStatut === "partiel" ? colors.warningBg : colors.dangerBg,
                  color: s.paiementStatut === "ok" ? colors.success : s.paiementStatut === "partiel" ? colors.warning : colors.danger,
                }}>
                  {s.paiementStatut === "ok" ? "A jour" : s.paiementStatut === "partiel" ? "Partiel" : "Impaye"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PresenceBar({ taux, colors }: { taux: number; colors: ReturnType<typeof useTheme>["colors"] }) {
  const barColor = taux >= 80 ? colors.success : taux >= 60 ? colors.warning : colors.danger;
  const barBg = taux >= 80 ? colors.successBg : taux >= 60 ? colors.warningBg : colors.dangerBg;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: barBg, borderRadius: 20 }}>
      <div style={{ width: 40, height: 6, background: colors.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${taux}%`, height: "100%", background: barColor, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{taux}%</span>
    </div>
  );
}
