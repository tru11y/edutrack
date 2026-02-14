import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  getAdminDashboardStatsSecure,
  getCloudFunctionErrorMessage,
  type AdminDashboardStats,
} from "../services/cloudFunctions";

export default function Dashboard() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboardStatsSecure()
      .then((res) => {
        setStats(res.stats);
      })
      .catch((err) => {
        setError(getCloudFunctionErrorMessage(err));
      })
      .finally(() => setLoading(false));
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          Bienvenue sur EduTrack - Vue d'ensemble de votre etablissement
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
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
            <p style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 4px" }}>
              {card.value}
            </p>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
              {card.title}
            </p>
          </Link>
        ))}
      </div>

      {/* Financial Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 24 }}>
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
      </div>

      {/* Quick Actions */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
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
      </div>
    </div>
  );
}
