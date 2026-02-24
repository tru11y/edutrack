import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPaiementsByEleve,
} from "./paiement.service";
import { getEleveById } from "../eleves/eleve.service";
import type { Eleve } from "../eleves/eleve.types";
import { exportRecuPaiementPDF } from "./paiement.pdf";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSchool } from "../../context/SchoolContext";
import type { Paiement } from "./paiement.types";

export default function PaiementEleve() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { school } = useSchool();

  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const [p, e] = await Promise.all([
        getPaiementsByEleve(id),
        getEleveById(id),
      ]);

      setPaiements(p);
      setEleve(e);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) return <div className="p-6" style={{ color: colors.text }}>Chargement…</div>;
  if (!eleve) return <div className="p-6" style={{ color: colors.text }}>Élève introuvable</div>;

  const statusColors = {
    paye: { bg: colors.successBg, color: colors.success },
    partiel: { bg: colors.warningBg, color: colors.warning },
    impaye: { bg: colors.dangerBg, color: colors.danger },
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold" style={{ color: colors.text }}>
        Paiements — {eleve.prenom} {eleve.nom}
      </h1>

      {paiements.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun paiement</p>
      ) : (
        <div
          style={{
            background: colors.bgCard,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead style={{ background: colors.bgSecondary }}>
              <tr>
                <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>Mois</th>
                <th style={{ padding: 12, textAlign: "right", color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>Total</th>
                <th style={{ padding: 12, textAlign: "right", color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>Payé</th>
                <th style={{ padding: 12, textAlign: "right", color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>Restant</th>
                <th style={{ padding: 12, textAlign: "center", color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>Statut</th>
                <th style={{ padding: 12, textAlign: "right", color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paiements.map((p, idx) => (
                <tr key={p.id} style={{ borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                  <td style={{ padding: 12, color: colors.text }}>{p.mois}</td>
                  <td style={{ padding: 12, textAlign: "right", color: colors.text }}>{p.montantTotal?.toLocaleString("fr-FR")} F</td>
                  <td style={{ padding: 12, textAlign: "right", color: colors.success }}>{p.montantPaye?.toLocaleString("fr-FR")} F</td>
                  <td style={{ padding: 12, textAlign: "right", color: p.montantRestant > 0 ? colors.danger : colors.textMuted }}>
                    {p.montantRestant?.toLocaleString("fr-FR")} F
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: statusColors[p.statut]?.bg || colors.bgSecondary,
                        color: statusColors[p.statut]?.color || colors.textMuted,
                      }}
                    >
                      {p.statut === "paye" ? "Payé" : p.statut === "partiel" ? "Partiel" : "Impayé"}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button
                      onClick={() =>
                        exportRecuPaiementPDF(p, {
                          eleveNom: eleve.nom,
                          elevePrenom: eleve.prenom,
                          classe: eleve.classe || "",
                          adminNom: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}`.trim() : user?.email || "Administration",
                          generatedByName: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}`.trim() : user?.email || "Administration",
                          schoolName: school?.schoolName,
                          schoolAdresse: school?.adresse,
                          schoolTelephone: school?.telephone,
                          schoolEmail: school?.email,
                          primaryColor: school?.primaryColor,
                          schoolLogo: school?.schoolLogo,
                        })
                      }
                      style={{
                        padding: "6px 12px",
                        background: colors.infoBg,
                        color: colors.info,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Reçu PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
