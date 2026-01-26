import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCoursByProfesseur } from "../cours/cours.service";
import type { Cours } from "../cours/cours.types";

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user?.professeurId) {
      setLoading(false);
      return;
    }

    getCoursByProfesseur(user.professeurId).then((data) => {
      const sorted = data.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.heureDebut.localeCompare(b.heureDebut);
      });
      setCours(sorted);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <p style={{ color: "#86868b" }}>Chargement...</p>
      </div>
    );
  }

  const coursAujourdhui = cours.filter(c => c.date === today);
  const coursAVenir = cours.filter(c => c.date > today && c.statut === "planifie").slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>
          Bonjour
        </h1>
        <p style={{ fontSize: 15, color: "#86868b" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: 20 }}>
          <p style={{ fontSize: 13, color: "#86868b", marginBottom: 8 }}>Total cours</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: "#1d1d1f" }}>{cours.length}</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: 20 }}>
          <p style={{ fontSize: 13, color: "#86868b", marginBottom: 8 }}>Aujourd'hui</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: "#007aff" }}>{coursAujourdhui.length}</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: 20 }}>
          <p style={{ fontSize: 13, color: "#86868b", marginBottom: 8 }}>À venir</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: "#34c759" }}>{coursAVenir.length}</p>
        </div>
      </div>

      {/* Cours aujourd'hui */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1d1d1f", marginBottom: 16 }}>Aujourd'hui</h2>

        {coursAujourdhui.length === 0 ? (
          <p style={{ color: "#86868b", fontSize: 14 }}>Aucun cours aujourd'hui</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {coursAujourdhui.map((c) => (
              <CoursItem key={c.id} cours={c} />
            ))}
          </div>
        )}
      </div>

      {/* Tous les cours */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1d1d1f", marginBottom: 16 }}>Tous mes cours</h2>

        {cours.length === 0 ? (
          <p style={{ color: "#86868b", fontSize: 14 }}>Aucun cours assigné</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: "#86868b" }}>Matière</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: "#86868b" }}>Classe</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: "#86868b" }}>Date</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: "#86868b" }}>Horaire</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: "#86868b" }}>Statut</th>
                <th style={{ padding: "12px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {cours.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f5f5f7" }}>
                  <td style={{ padding: "12px 8px", fontSize: 14, fontWeight: 500, color: "#1d1d1f" }}>{c.matiere}</td>
                  <td style={{ padding: "12px 8px", fontSize: 14, color: "#86868b" }}>{c.classe}</td>
                  <td style={{ padding: "12px 8px", fontSize: 14, color: "#86868b" }}>
                    {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 14, color: "#86868b" }}>{c.heureDebut} - {c.heureFin}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <StatusBadge statut={c.statut} />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <Link to={`/prof/cours/${c.id}`} style={{ fontSize: 14, color: "#007aff", textDecoration: "none", fontWeight: 500 }}>
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CoursItem({ cours }: { cours: Cours }) {
  return (
    <Link
      to={`/prof/cours/${cours.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        background: "#f5f5f7",
        borderRadius: 12,
        textDecoration: "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#007aff",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 600
        }}>
          {cours.heureDebut}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#1d1d1f" }}>{cours.matiere}</p>
          <p style={{ fontSize: 13, color: "#86868b" }}>{cours.classe} · {cours.heureDebut} - {cours.heureFin}</p>
        </div>
      </div>
      <StatusBadge statut={cours.statut} />
    </Link>
  );
}

function StatusBadge({ statut }: { statut: Cours["statut"] }) {
  const config = {
    planifie: { label: "Planifié", bg: "#e3f2fd", color: "#1976d2" },
    termine: { label: "Terminé", bg: "#e8f5e9", color: "#388e3c" },
    annule: { label: "Annulé", bg: "#ffebee", color: "#d32f2f" },
  };

  const { label, bg, color } = config[statut];

  return (
    <span style={{
      fontSize: 12,
      fontWeight: 500,
      padding: "4px 10px",
      borderRadius: 6,
      background: bg,
      color
    }}>
      {label}
    </span>
  );
}
