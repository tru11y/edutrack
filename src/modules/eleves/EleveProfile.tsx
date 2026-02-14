import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEleveById } from "./eleve.service";
import { useTheme } from "../../context/ThemeContext";

export default function EleveProfile() {
  const { id } = useParams<{ id: string }>();
  const { colors } = useTheme();

  const [eleve, setEleve] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getEleveById(id)
      .then((data) => {
        if (!data) {
          setError("Élève introuvable");
        } else {
          setEleve(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6" style={{ color: colors.text }}>Chargement…</div>;
  if (error) return <div className="p-6" style={{ color: colors.danger }}>{error}</div>;
  if (!eleve) return <div className="p-6" style={{ color: colors.danger }}>Élève introuvable</div>;

  return (
    <div className="p-6 max-w-3xl space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            {eleve.prenom} {eleve.nom}
          </h1>
          <p style={{ color: colors.textMuted }}>
            Classe : {eleve.classe}
          </p>
        </div>

        {eleve.isBanned && (
          <span
            className="px-3 py-1 rounded text-sm font-semibold"
            style={{ background: colors.dangerBg, color: colors.danger }}
          >
            Banni
          </span>
        )}
      </div>

      {/* INFOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Info label="Nom" value={eleve.nom} colors={colors} />
        <Info label="Prénom" value={eleve.prenom} colors={colors} />
        <Info label="Sexe" value={eleve.sexe} colors={colors} />
        <Info label="Classe" value={eleve.classe} colors={colors} />
        <Info label="Statut" value={eleve.statut} colors={colors} />
        <Info label="École d'origine" value={eleve.ecoleOrigine || "—"} colors={colors} />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <Link
          to={`/admin/eleves/${eleve.id}/paiements`}
          className="px-4 py-2 rounded"
          style={{ background: colors.primary, color: colors.onGradient }}
        >
          Paiements
        </Link>

        <Link
          to={`/admin/eleves`}
          className="px-4 py-2 rounded"
          style={{ background: colors.bgSecondary, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
        >
          Retour
        </Link>
      </div>

      {/* BANNISSEMENT */}
      {eleve.isBanned && (
        <div
          className="p-4 rounded"
          style={{ background: colors.dangerBg, border: `1px solid ${colors.danger}40` }}
        >
          <p style={{ color: colors.danger, fontWeight: 600 }}>
            Élève suspendu
          </p>
          <p style={{ fontSize: 14, color: colors.danger }}>
            Raison : {eleve.banReason || "—"}
          </p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, colors }: { label: string; value: string | number | undefined; colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"] }) {
  return (
    <div
      className="p-4 rounded"
      style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
    >
      <p style={{ fontSize: 14, color: colors.textMuted }}>{label}</p>
      <p style={{ fontWeight: 600, color: colors.text }}>{value || "—"}</p>
    </div>
  );
}
