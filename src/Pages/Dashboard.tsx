import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { cacheData, getCachedData, clearCache } from "../utils/offlineCache";
import { useDashboardWidgets } from "../hooks/useDashboardWidgets";
import DashboardWidgetConfig from "../components/DashboardWidgetConfig";
import {
  getAdminDashboardStatsSecure,
  getAtRiskStudentsSecure,
  getRecommendationsSecure,
  runDataMigrationSecure,
  getCloudFunctionErrorMessage,
  type AdminDashboardStats,
  type AtRiskStudent,
  type Recommendation,
} from "../services/cloudFunctions";

const MIGRATION_KEY = "edutrack_migrated_v2";

export default function Dashboard() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const { widgets, toggleWidget, reorderWidgets, resetToDefault, isVisible } = useDashboardWidgets();

  useEffect(() => {
    const load = async () => {
      const cached = getCachedData<AdminDashboardStats>("dashboard_stats");
      if (cached) {
        setStats(cached);
        setLoading(false);
      }
      if (!localStorage.getItem(MIGRATION_KEY)) {
        try { await runDataMigrationSecure(); } catch { /* silent */ }
        clearCache("dashboard_stats");
        localStorage.setItem(MIGRATION_KEY, "true");
      }
      getAdminDashboardStatsSecure()
        .then((res) => { setStats(res.stats); cacheData("dashboard_stats", res.stats); })
        .catch((err) => { if (!cached) setError(getCloudFunctionErrorMessage(err)); })
        .finally(() => setLoading(false));
      getAtRiskStudentsSecure().then((res) => setAtRiskStudents(res.students || [])).catch(() => {});
      getRecommendationsSecure().then((res) => setRecommendations(res.recommendations || [])).catch(() => {});
    };
    load(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, []);

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
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement du tableau de bord...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 420 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: colors.danger, margin: "0 0 8px" }}>Erreur de chargement</p>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>{error || "Impossible de charger les statistiques."}</p>
        </div>
      </div>
    );
  }

  const tresoNette = stats.totalPaiementsRecus - stats.totalDepenses - stats.totalSalaires;
  const ratioElevesProf = stats.totalProfesseurs > 0 ? Math.round(stats.totalEleves / stats.totalProfesseurs) : 0;
  const tauxColor = stats.tauxCouverture >= 80 ? colors.success : stats.tauxCouverture >= 50 ? colors.warning : colors.danger;
  const tauxBg = stats.tauxCouverture >= 80 ? colors.successBg : stats.tauxCouverture >= 50 ? colors.warningBg : colors.dangerBg;

  const cardBase = {
    borderRadius: 18,
    padding: "24px 24px 22px",
    border: `1px solid ${colors.border}`,
    textDecoration: "none",
    display: "block",
    background: colors.bgCard,
    transition: "transform 0.15s, box-shadow 0.15s",
  } as const;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
            Vue d'ensemble · Open World Group Education
          </p>
        </div>
        <button
          onClick={() => setShowWidgetConfig(true)}
          style={{
            padding: "9px 16px", background: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 500, color: colors.textMuted,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M4.22 15.78L5.64 14.36M14.36 5.64L15.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {t("widgetConfig")}
        </button>
      </div>

      {showWidgetConfig && (
        <DashboardWidgetConfig widgets={widgets} onToggle={toggleWidget} onReorder={reorderWidgets} onReset={resetToDefault} onClose={() => setShowWidgetConfig(false)} />
      )}

      {/* ── KPI Cards ── */}
      {isVisible("stats") && (
        <div aria-live="polite" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18, marginBottom: 20 }}>

          {/* Élèves */}
          <Link to="/eleves" style={{ ...cardBase, borderLeft: `4px solid ${colors.primary}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: colors.primaryBg, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21M23 21V19C23 17.14 21.87 15.57 20.24 15.13M16.24 3.13C17.87 3.57 19 5.14 19 7C19 8.86 17.87 10.43 16.24 10.87M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: colors.successBg, color: colors.success, letterSpacing: "0.3px" }}>
                INSCRITS
              </span>
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: colors.text, lineHeight: 1, marginBottom: 6, letterSpacing: "-1px" }}>
              {stats.totalEleves}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>Élèves</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.primary, fontWeight: 500 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6H15" stroke="currentColor" strokeWidth="1.5"/></svg>
              {stats.totalClasses} classes · {stats.totalMatieres} matières
            </div>
          </Link>

          {/* Professeurs */}
          <Link to="/utilisateurs" style={{ ...cardBase, borderLeft: `4px solid ${colors.info}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: colors.infoBg, color: colors.info, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15L3.5 10L12 5L20.5 10L12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 10V16L12 21L20.5 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: colors.infoBg, color: colors.info, letterSpacing: "0.3px" }}>
                ACTIFS
              </span>
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: colors.text, lineHeight: 1, marginBottom: 6, letterSpacing: "-1px" }}>
              {stats.totalProfesseurs}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>Professeurs</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.info, fontWeight: 500 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5V9L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {ratioElevesProf > 0 ? `${ratioElevesProf} élèves / prof` : "Aucun professeur"}
            </div>
          </Link>

          {/* Paiements */}
          <Link to="/paiements" style={{ ...cardBase, borderLeft: `4px solid ${tauxColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: tauxBg, color: tauxColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 15H9M12 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: tauxBg, color: tauxColor, letterSpacing: "0.3px" }}>
                {stats.tauxCouverture}%
              </span>
            </div>
            <div style={{ fontSize: stats.totalPaiementsRecus >= 1000000 ? 32 : 38, fontWeight: 800, color: colors.text, lineHeight: 1, marginBottom: 6, letterSpacing: "-1px" }}>
              {stats.totalPaiementsRecus.toLocaleString()} <span style={{ fontSize: 18, fontWeight: 600, color: colors.textMuted }}>FCFA</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>Paiements collectés</div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ height: 5, background: colors.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${stats.tauxCouverture}%`, height: "100%", background: tauxColor, borderRadius: 3, transition: "width 0.8s ease" }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
              sur {stats.totalPaiementsAttendus.toLocaleString()} FCFA attendus
            </div>
          </Link>

          {/* Trésorerie nette */}
          <Link to="/comptabilite" style={{ ...cardBase, borderLeft: `4px solid ${tresoNette >= 0 ? colors.success : colors.danger}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: tresoNette >= 0 ? colors.successBg : colors.dangerBg, color: tresoNette >= 0 ? colors.success : colors.danger, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2V22M17 5H9.5C8.12 5 7 6.12 7 7.5C7 8.88 8.12 10 9.5 10H14.5C15.88 10 17 11.12 17 12.5C17 13.88 15.88 15 14.5 15H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: tresoNette >= 0 ? colors.successBg : colors.dangerBg,
                color: tresoNette >= 0 ? colors.success : colors.danger, letterSpacing: "0.3px",
              }}>
                {tresoNette >= 0 ? "POSITIF" : "DÉFICIT"}
              </span>
            </div>
            <div style={{ fontSize: tresoNette >= 1000000 || tresoNette <= -1000000 ? 28 : 36, fontWeight: 800, color: tresoNette >= 0 ? colors.success : colors.danger, lineHeight: 1, marginBottom: 6, letterSpacing: "-1px" }}>
              {tresoNette >= 0 ? "+" : ""}{tresoNette.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>F</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 10 }}>Trésorerie nette</div>
            <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500, display: "flex", gap: 12 }}>
              <span>Dép. {stats.totalDepenses.toLocaleString()} F</span>
              <span>Sal. {stats.totalSalaires.toLocaleString()} F</span>
            </div>
          </Link>

        </div>
      )}

      {/* ── Ligne secondaire KPIs ── */}
      {isVisible("stats") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Classes", value: stats.totalClasses, color: colors.primary, link: "/classes" },
            { label: "Matières", value: stats.totalMatieres, color: colors.info, link: "/matieres" },
            { label: "Emploi du temps", value: stats.totalSalles, color: colors.warning, link: "/emploi-du-temps" },
            { label: "Utilisateurs", value: stats.totalUsers, color: colors.success, link: "/utilisateurs" },
          ].map((kpi) => (
            <Link key={kpi.label} to={kpi.link} style={{
              background: colors.bgCard, borderRadius: 14, padding: "16px 18px",
              border: `1px solid ${colors.border}`, textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, lineHeight: 1, marginBottom: 4 }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>{kpi.label}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: kpi.color, opacity: 0.6 }} />
            </Link>
          ))}
        </div>
      )}

      {/* ── Élèves à risque ── */}
      {isVisible("atRisk") && atRiskStudents.length > 0 && (
        <div style={{ background: colors.dangerBg, borderRadius: 16, border: `1px solid ${colors.danger}30`, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.danger, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.36 18.78 1.93 19.74 2.83 19.74H21.17C22.07 19.74 22.64 18.78 22.18 18L13.71 3.86C13.25 3.09 12.75 3.09 12.29 3.86H10.29Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t("atRiskStudents")} — {atRiskStudents.length} signalé{atRiskStudents.length > 1 ? "s" : ""}
            </h2>
            <Link to="/eleves" style={{ fontSize: 13, color: colors.danger, textDecoration: "none", fontWeight: 600 }}>Voir tous →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {atRiskStudents.slice(0, 5).map((student) => (
              <Link key={student.eleveId} to={`/eleves/${student.eleveId}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: colors.bgCard, borderRadius: 10,
                textDecoration: "none", border: `1px solid ${colors.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.dangerBg, color: colors.danger, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {student.prenom?.[0]}{student.nom?.[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {student.prenom} {student.nom}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textMuted }}>{student.classe}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {student.risks.map((risk, i) => (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                      background: risk.severity === "danger" ? colors.dangerBg : colors.warningBg,
                      color: risk.severity === "danger" ? colors.danger : colors.warning,
                    }}>
                      {risk.type === "absence" ? t("riskAbsence") : risk.type === "payment" ? t("riskPayment") : t("riskGrades")}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions rapides + Recommandations (2 colonnes) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 0, alignItems: "start" }}>

        {/* Actions rapides */}
        {isVisible("quickActions") && (
          <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Actions rapides</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { to: "/eleves/nouveau", label: "Inscrire un élève", color: colors.primary, bg: colors.primaryBg },
                { to: "/paiements/nouveau", label: "Enregistrer un paiement", color: colors.warning, bg: colors.warningBg },
                { to: "/stats", label: "Statistiques détaillées", color: colors.info, bg: colors.infoBg },
                { to: "/comptabilite", label: "Comptabilité", color: colors.success, bg: colors.successBg },
              ].map((a) => (
                <Link key={a.to} to={a.to} style={{
                  padding: "12px 16px", borderRadius: 10, textDecoration: "none",
                  fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10,
                  background: a.bg, color: a.color, border: `1px solid ${a.color}25`,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations IA */}
        {recommendations.length > 0 && (
          <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                Recommandations IA
                <span style={{
                  marginLeft: 4, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: colors.dangerBg, color: colors.danger,
                }}>
                  {recommendations.filter(r => r.priority === "haute").length} urgentes
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recommendations.map((rec, i) => {
                const catStyle: Record<string, { bg: string; color: string; emoji: string }> = {
                  financier:      { bg: colors.warningBg,  color: colors.warning, emoji: "💰" },
                  academique:     { bg: colors.infoBg,     color: colors.info,    emoji: "📚" },
                  organisationnel:{ bg: colors.primaryBg,  color: colors.primary, emoji: "⚙️" },
                  croissance:     { bg: colors.successBg,  color: colors.success, emoji: "📈" },
                  marketing:      { bg: colors.successBg,  color: colors.success, emoji: "📣" },
                };
                const prio: Record<string, string> = { haute: colors.danger, moyenne: colors.warning, basse: colors.info };
                const c = catStyle[rec.category] ?? { bg: colors.bgSecondary, color: colors.textMuted, emoji: "•" };
                return (
                  <div key={i} style={{
                    borderRadius: 12, border: `1px solid ${colors.border}`,
                    background: colors.bgSecondary, overflow: "hidden",
                  }}>
                    {/* Barre de priorité en haut */}
                    <div style={{ height: 3, background: prio[rec.priority] ?? colors.border }} />
                    <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {c.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Titre + badges */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{rec.titre}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${prio[rec.priority]}20`, color: prio[rec.priority], letterSpacing: "0.4px" }}>
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        {/* Détail */}
                        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px", lineHeight: 1.5 }}>{rec.detail}</p>
                        {/* Plan d'action */}
                        <div style={{ background: `${c.color}12`, borderRadius: 8, padding: "8px 12px", marginBottom: 8, borderLeft: `3px solid ${c.color}` }}>
                          <p style={{ fontSize: 12, color: c.color, margin: 0, fontWeight: 600, lineHeight: 1.6 }}>{rec.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
