import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

interface Stats {
  eleves: number;
  presences: number;
  paiements: number;
  cahiers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ eleves: 0, presences: 0, paiements: 0, cahiers: 0 });
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

        setStats({
          eleves: elevesSnap.size,
          presences: presencesSnap.size,
          paiements: paiementsSnap.size,
          cahiers: cahiersSnap.size,
        });
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
      title: "Eleves",
      value: stats.eleves,
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
          Bienvenue sur EduTrack - Gestion scolaire simplifiee
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
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
            <p style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
              {card.value}
            </p>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              {card.title}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>
          Actions rapides
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            to="/eleves/nouveau"
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Ajouter un eleve
          </Link>
          <Link
            to="/presences/appel"
            style={{
              padding: "12px 20px",
              background: "#ecfdf5",
              color: "#10b981",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #a7f3d0",
            }}
          >
            Faire l'appel
          </Link>
          <Link
            to="/cahier/nouveau"
            style={{
              padding: "12px 20px",
              background: "#f5f3ff",
              color: "#8b5cf6",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #ddd6fe",
            }}
          >
            Remplir le cahier
          </Link>
          <Link
            to="/paiements/nouveau"
            style={{
              padding: "12px 20px",
              background: "#fffbeb",
              color: "#f59e0b",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #fde68a",
            }}
          >
            Enregistrer un paiement
          </Link>
        </div>
      </div>
    </div>
  );
}
