import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { cacheData, getCachedData } from "../utils/offlineCache";
import { useDashboardWidgets } from "../hooks/useDashboardWidgets";
import DashboardWidgetConfig from "../components/DashboardWidgetConfig";
import {
  getAdminDashboardStatsSecure,
  getAtRiskStudentsSecure,
  getRecommendationsSecure,
  getCloudFunctionErrorMessage,
  type AdminDashboardStats,
  type AtRiskStudent,
  type Recommendation,
} from "../services/cloudFunctions";

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
    // Load cached data immediately for instant display
    const cached = getCachedData<AdminDashboardStats>("dashboard_stats");
    if (cached) {
      setStats(cached);
      setLoading(false);
    }

    getAdminDashboardStatsSecure()
      .then((res) => {
        setStats(res.stats);
        cacheData("dashboard_stats", res.stats);
      })
      .catch((err) => {
        if (!cached) setError(getCloudFunctionErrorMessage(err));
      })
      .finally(() => setLoading(false));

    getAtRiskStudentsSecure().then((res) => setAtRiskStudents(res.students || [])).catch(() => {});
    getRecommendationsSecure().then((res) => setRecommendations(res.recommendations || [])).catch(() => {});
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
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400,
      }}>
        <div style={{
          background: colors.dangerBg, border: `1px solid ${colors.danger}40`,
          borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 420,
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: colors.danger, margin: "0 0 8px" }}>
            Erreur de chargement
          </p>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
            {error || "Impossible de charger les statistiques."}
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Eleves",
      value: stats.totalEleves,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21M23 21V19C23 17.14 21.87 15.57 20.24 15.13M16.24 3.13C17.87 3.57 19 5.14 19 7C19 8.86 17.87 10.43 16.24 10.87M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: colors.primary,
      bg: colors.primaryBg,
      link: "/eleves",
    },
    {
      title: "Professeurs",
      value: stats.totalProfesseurs,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 15L3.5 10L12 5L20.5 10L12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.5 10V16L12 21L20.5 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: colors.primary,
      bg: colors.primaryBg,
      link: "/utilisateurs",
    },
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 3V21M2 9H22" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: colors.info,
      bg: colors.infoBg,
      link: "/classes",
    },
    {
      title: "Taux de couverture",
      value: `${stats.tauxCouverture}%`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 5L5 19M9 7C9 8.10457 8.10457 9 7 9C5.89543 9 5 8.10457 5 7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7ZM19 17C19 18.1046 18.1046 19 17 19C15.8954 19 15 18.1046 15 17C15 15.8954 15.8954 15 17 15C18.1046 15 19 15.8954 19 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: stats.tauxCouverture >= 80 ? colors.success : stats.tauxCouverture >= 50 ? colors.warning : colors.danger,
      bg: stats.tauxCouverture >= 80 ? colors.successBg : stats.tauxCouverture >= 50 ? colors.warningBg : colors.dangerBg,
      link: "/paiements",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
            Bienvenue sur EduTrack - Vue d'ensemble de votre etablissement
          </p>
        </div>
        <button
          onClick={() => setShowWidgetConfig(true)}
          style={{
            padding: "10px 16px", background: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 500, color: colors.textMuted,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M4.22 15.78L5.64 14.36M14.36 5.64L15.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {t("widgetConfig")}
        </button>
      </div>

      {showWidgetConfig && (
        <DashboardWidgetConfig
          widgets={widgets}
          onToggle={toggleWidget}
          onReorder={reorderWidgets}
          onReset={resetToDefault}
          onClose={() => setShowWidgetConfig(false)}
        />
      )}

      {/* Stats Cards */}
      {isVisible("stats") && <div aria-live="polite" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            style={{
              background: colors.bgCard,
              borderRadius: 16,
              padding: 20,
              border: `1px solid ${colors.border}`,
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: card.bg, color: card.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {card.value}
            </p>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
              {card.title}
            </p>
          </Link>
        ))}
      </div>}

      {/* At-Risk Students */}
      {isVisible("atRisk") && atRiskStudents.length > 0 && (
        <div style={{ background: colors.dangerBg, borderRadius: 16, border: `1px solid ${colors.danger}40`, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.danger, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.36 18.78 1.93 19.74 2.83 19.74H21.17C22.07 19.74 22.64 18.78 22.18 18L13.71 3.86C13.25 3.09 12.75 3.09 12.29 3.86H10.29Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t("atRiskStudents")} ({atRiskStudents.length})
            </h2>
            <Link to="/eleves" style={{ fontSize: 13, color: colors.danger, textDecoration: "none", fontWeight: 500 }}>
              Voir tous →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {atRiskStudents.slice(0, 5).map((student) => (
              <Link
                key={student.eleveId}
                to={`/eleves/${student.eleveId}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: colors.bgCard, borderRadius: 10,
                  textDecoration: "none", border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {student.prenom} {student.nom}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>{student.classe}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {student.risks.map((risk, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6,
                        background: risk.severity === "danger" ? colors.dangerBg : colors.warningBg,
                        color: risk.severity === "danger" ? colors.danger : colors.warning,
                      }}
                    >
                      {risk.type === "absence" ? t("riskAbsence") : risk.type === "payment" ? t("riskPayment") : t("riskGrades")}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Financial Overview */}
      {isVisible("finances") && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 24 }}>
        {/* Taux de recouvrement */}
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>
            Taux de recouvrement
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 100, height: 100 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke={colors.border} strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={stats.tauxCouverture >= 80 ? colors.success : stats.tauxCouverture >= 50 ? colors.warning : colors.danger}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${stats.tauxCouverture * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: colors.text,
              }}>
                {stats.tauxCouverture}%
              </div>
            </div>
            <div>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: "0 0 8px" }}>
                {stats.totalPaiementsRecus.toLocaleString()} FCFA collectes
              </p>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
                sur {stats.totalPaiementsAttendus.toLocaleString()} FCFA attendus
              </p>
            </div>
          </div>
        </div>

        {/* Finances */}
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>
            Finances
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: colors.success }} />
                <span style={{ fontSize: 14, color: colors.textMuted }}>Paiements recus</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.success }}>
                {stats.totalPaiementsRecus.toLocaleString()} F
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: colors.warning }} />
                <span style={{ fontSize: 14, color: colors.textMuted }}>Depenses</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.warning }}>
                {stats.totalDepenses.toLocaleString()} F
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: colors.danger }} />
                <span style={{ fontSize: 14, color: colors.textMuted }}>Salaires</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.danger }}>
                {stats.totalSalaires.toLocaleString()} F
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 8, height: 8, background: colors.border, borderRadius: 4, overflow: "hidden", display: "flex" }}>
              {stats.totalPaiementsAttendus > 0 && (
                <div style={{
                  width: `${(stats.totalPaiementsRecus / stats.totalPaiementsAttendus) * 100}%`,
                  background: colors.success,
                }} />
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* Quick Actions */}
      {isVisible("quickActions") && <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>
          Actions rapides
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Link
            to="/eleves/nouveau"
            style={{
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
              color: colors.onGradient, borderRadius: 10, textDecoration: "none",
              fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Inscrire un nouvel eleve
          </Link>
          <Link
            to="/paiements/nouveau"
            style={{
              padding: "14px 16px",
              background: colors.warningBg, color: colors.warning,
              borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500,
              border: `1px solid ${colors.warning}40`,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 8H16" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Enregistrer un paiement
          </Link>
          <Link
            to="/stats"
            style={{
              padding: "14px 16px",
              background: colors.successBg, color: colors.success,
              borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500,
              border: `1px solid ${colors.success}40`,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 14V8M6 14V4M10 14V10M14 14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Voir les statistiques
          </Link>
          <Link
            to="/comptabilite"
            style={{
              padding: "14px 16px",
              background: colors.infoBg, color: colors.info,
              borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500,
              border: `1px solid ${colors.info}40`,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 8H16" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="11" r="1" fill="currentColor"/>
            </svg>
            Comptabilite
          </Link>
        </div>
      </div>}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Recommandations
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recommendations.map((rec, i) => {
              const catColors: Record<string, { bg: string; color: string }> = {
                financier: { bg: colors.warningBg, color: colors.warning },
                academique: { bg: colors.infoBg, color: colors.info },
                organisationnel: { bg: colors.primaryBg, color: colors.primary },
                marketing: { bg: colors.successBg, color: colors.success },
              };
              const prioColors: Record<string, string> = {
                haute: colors.danger,
                moyenne: colors.warning,
                basse: colors.info,
              };
              const c = catColors[rec.category] ?? { bg: colors.bgSecondary, color: colors.text };
              return (
                <div key={i} style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: colors.bgSecondary, border: `1px solid ${colors.border}`,
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  <div style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                    background: c.bg, color: c.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {rec.category === "financier" ? "₣" : rec.category === "academique" ? "📚" : rec.category === "marketing" ? "📣" : "⚙"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{rec.titre}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 6,
                        background: `${prioColors[rec.priority]}20`, color: prioColors[rec.priority],
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 4px" }}>{rec.detail}</p>
                    <p style={{ fontSize: 12, color: c.color, margin: 0, fontStyle: "italic" }}>{rec.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
