import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getCoursByProfesseur } from "../cours/cours.service";
import type { Cours } from "../cours/cours.types";

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
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
        <p style={{ color: colors.textMuted }}>Chargement...</p>
      </div>
    );
  }

  const coursAujourdhui = cours.filter(c => c.date === today);
  const coursAVenir = cours.filter(c => c.date > today && c.statut === "planifie").slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
          Bonjour
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Total cours</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: colors.text }}>{cours.length}</p>
        </div>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Aujourd'hui</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: colors.primary }}>{coursAujourdhui.length}</p>
        </div>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>À venir</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: colors.success }}>{coursAVenir.length}</p>
        </div>
      </div>

      {/* Cours aujourd'hui */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Aujourd'hui</h2>

        {coursAujourdhui.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Aucun cours aujourd'hui</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {coursAujourdhui.map((c) => (
              <CoursItem key={c.id} cours={c} colors={colors} />
            ))}
          </div>
        )}
      </div>

      {/* Tous les cours */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Tous mes cours</h2>

        {cours.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Aucun cours assigné</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: colors.textMuted }}>Matière</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: colors.textMuted }}>Classe</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: colors.textMuted }}>Date</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: colors.textMuted }}>Horaire</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, fontWeight: 500, color: colors.textMuted }}>Statut</th>
                <th style={{ padding: "12px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {cours.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: "12px 8px", fontSize: 14, fontWeight: 500, color: colors.text }}>{c.matiere}</td>
                  <td style={{ padding: "12px 8px", fontSize: 14, color: colors.textMuted }}>{c.classe}</td>
                  <td style={{ padding: "12px 8px", fontSize: 14, color: colors.textMuted }}>
                    {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 14, color: colors.textMuted }}>{c.heureDebut} - {c.heureFin}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <StatusBadge statut={c.statut} colors={colors} />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <Link to={`/prof/cours/${c.id}`} style={{ fontSize: 14, color: colors.primary, textDecoration: "none", fontWeight: 500 }}>
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

function CoursItem({ cours, colors }: { cours: Cours; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <Link
      to={`/prof/cours/${cours.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        background: colors.bgSecondary,
        borderRadius: 12,
        textDecoration: "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: colors.primary,
          color: colors.onGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 600
        }}>
          {cours.heureDebut}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: colors.text }}>{cours.matiere}</p>
          <p style={{ fontSize: 13, color: colors.textMuted }}>{cours.classe} · {cours.heureDebut} - {cours.heureFin}</p>
        </div>
      </div>
      <StatusBadge statut={cours.statut} colors={colors} />
    </Link>
  );
}

function StatusBadge({ statut, colors }: { statut: Cours["statut"]; colors: ReturnType<typeof useTheme>["colors"] }) {
  const config = {
    planifie: { label: "Planifié", bg: colors.infoBg, color: colors.info },
    termine: { label: "Terminé", bg: colors.successBg, color: colors.success },
    annule: { label: "Annulé", bg: colors.dangerBg, color: colors.danger },
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
