import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import type { Paiement } from "../modules/paiements/paiement.types";

interface Stats {
  eleves: number;
  elevesActifs: number;
  presences: number;
  paiements: number;
  cahiers: number;
  paiementsPaye: number;
  paiementsPartiel: number;
  paiementsImpaye: number;
  totalPaye: number;
  totalDu: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin2 = user?.role === "admin2";
  const [stats, setStats] = useState<Stats>({
    eleves: 0,
    elevesActifs: 0,
    presences: 0,
    paiements: 0,
    cahiers: 0,
    paiementsPaye: 0,
    paiementsPartiel: 0,
    paiementsImpaye: 0,
    totalPaye: 0,
    totalDu: 0,
  });
  const [recentPaiements, setRecentPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [elevesSnap, presencesSnap, paiementsSnap, cahiersSnap] = await Promise.all([
          getDocs(collection(db, "eleves")),
          getDocs(collection(db, "presences")),
          getDocs(collection(db, "paiements")),
          getDocs(collection(db, "cahier")),
        ]);

        // Calculate eleve stats
        const elevesData = elevesSnap.docs.map((d) => d.data());
        const elevesActifs = elevesData.filter((e) => e.statut === "actif").length;

        // Calculate paiement stats
        const paiementsData = paiementsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Paiement[];
        const paiementsPaye = paiementsData.filter((p) => p.statut === "paye").length;
        const paiementsPartiel = paiementsData.filter((p) => p.statut === "partiel").length;
        const paiementsImpaye = paiementsData.filter((p) => p.statut === "impaye").length;
        const totalPaye = paiementsData.reduce((sum, p) => sum + (p.montantPaye || 0), 0);
        const totalDu = paiementsData.reduce((sum, p) => sum + (p.montantTotal || 0), 0);

        // Get recent paiements
        const recent = paiementsData
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);

        setStats({
          eleves: elevesSnap.size,
          elevesActifs,
          presences: presencesSnap.size,
          paiements: paiementsSnap.size,
          cahiers: cahiersSnap.size,
          paiementsPaye,
          paiementsPartiel,
          paiementsImpaye,
          totalPaye,
          totalDu,
        });
        setRecentPaiements(recent);
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: "Eleves actifs",
      value: stats.elevesActifs,
      subtitle: `${stats.eleves} total`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21M23 21V19C23 17.14 21.87 15.57 20.24 15.13M16.24 3.13C17.87 3.57 19 5.14 19 7C19 8.86 17.87 10.43 16.24 10.87M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "#6366f1",
      bg: "#eef2ff",
      link: "/eleves",
    },
    {
      title: "Presences",
      value: stats.presences,
      subtitle: "enregistrees",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "#10b981",
      bg: "#ecfdf5",
      link: "/presences",
    },
    {
      title: "Paiements",
      value: stats.paiements,
      subtitle: `${stats.paiementsPaye} payes`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: "#f59e0b",
      bg: "#fffbeb",
      link: "/paiements",
    },
    {
      title: "Cahier de texte",
      value: stats.cahiers,
      subtitle: "entrees",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H18.5C19.33 3 20 3.67 20 4.5V19.5C20 20.33 19.33 21 18.5 21H5.5C4.67 21 4 20.33 4 19.5Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 3V21M4 9H20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: "#8b5cf6",
      bg: "#f5f3ff",
      link: "/cahier",
    },
  ];

  const tauxRecouvrement = stats.totalDu > 0 ? Math.round((stats.totalPaye / stats.totalDu) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid #e2e8f0",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
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
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: card.bg,
                color: card.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
              {card.value}
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              {card.title}
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
              {card.subtitle}
            </p>
          </Link>
        ))}
      </div>

      {/* Financial Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 24 }}>
        {/* Taux de recouvrement */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>
            Taux de recouvrement
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 100, height: 100 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={tauxRecouvrement >= 80 ? "#10b981" : tauxRecouvrement >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${tauxRecouvrement * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: "#1e293b"
              }}>
                {tauxRecouvrement}%
              </div>
            </div>
            <div>
              {isAdmin2 ? (
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                  {stats.paiementsPaye} payes sur {stats.paiements} total
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 8px" }}>
                    {stats.totalPaye.toLocaleString()} FCFA collectes
                  </p>
                  <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                    sur {stats.totalDu.toLocaleString()} FCFA attendus
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Repartition paiements */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>
            Repartition des paiements
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "#10b981" }} />
                <span style={{ fontSize: 14, color: "#64748b" }}>Payes</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>{stats.paiementsPaye}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "#f59e0b" }} />
                <span style={{ fontSize: 14, color: "#64748b" }}>Partiels</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>{stats.paiementsPartiel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444" }} />
                <span style={{ fontSize: 14, color: "#64748b" }}>Impayes</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>{stats.paiementsImpaye}</span>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 8, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", display: "flex" }}>
              {stats.paiements > 0 && (
                <>
                  <div style={{ width: `${(stats.paiementsPaye / stats.paiements) * 100}%`, background: "#10b981" }} />
                  <div style={{ width: `${(stats.paiementsPartiel / stats.paiements) * 100}%`, background: "#f59e0b" }} />
                  <div style={{ width: `${(stats.paiementsImpaye / stats.paiements) * 100}%`, background: "#ef4444" }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Paiements & Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {/* Recent Paiements */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: 0 }}>
              Derniers paiements
            </h2>
            <Link to="/paiements" style={{ fontSize: 13, color: "#6366f1", textDecoration: "none" }}>
              Voir tout →
            </Link>
          </div>
          {recentPaiements.length === 0 ? (
            <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", padding: 20 }}>Aucun paiement</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentPaiements.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", margin: 0 }}>{p.eleveNom}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{p.mois}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {!isAdmin2 && <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>{p.montantPaye?.toLocaleString()} FCFA</p>}
                    <span style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: p.statut === "paye" ? "#ecfdf5" : p.statut === "partiel" ? "#fffbeb" : "#fef2f2",
                      color: p.statut === "paye" ? "#10b981" : p.statut === "partiel" ? "#f59e0b" : "#ef4444"
                    }}>
                      {p.statut === "paye" ? "Paye" : p.statut === "partiel" ? "Partiel" : "Impaye"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>
            Actions rapides
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              to="/eleves/nouveau"
              style={{
                padding: "14px 16px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Inscrire un nouvel eleve
            </Link>
            <Link
              to="/presences/appel"
              style={{
                padding: "14px 16px",
                background: "#ecfdf5",
                color: "#10b981",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Faire l'appel du jour
            </Link>
            <Link
              to="/cahier/nouveau"
              style={{
                padding: "14px 16px",
                background: "#f5f3ff",
                color: "#8b5cf6",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid #ddd6fe",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 14V4C3 3.17 3.67 2.5 4.5 2.5H13.5C14.33 2.5 15 3.17 15 4V14C15 14.83 14.33 15.5 13.5 15.5H4.5C3.67 15.5 3 14.83 3 14Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 2.5V15.5M3 7H15" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Remplir le cahier de texte
            </Link>
            <Link
              to="/paiements/nouveau"
              style={{
                padding: "14px 16px",
                background: "#fffbeb",
                color: "#f59e0b",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 8H16" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Enregistrer un paiement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
