import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getProfesseurById } from "./professeur.service";
import { getCoursByProfesseur } from "../cours/cours.service";
import type { Professeur } from "./professeur.types";
import type { Cours } from "../cours/cours.types";

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [prof, setProf] = useState<Professeur | null>(null);
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !user.professeurId) return;

      const p = await getProfesseurById(user.professeurId);
      if (!p) {
        setLoading(false);
        return;
      }

      if (!p.id) {
        setLoading(false);
        return;
      }
      const c = await getCoursByProfesseur(p.id);
      setProf(p);
      setCours(c);
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) return <div className="p-6" style={{ color: colors.textMuted }}>Chargement…</div>;
  if (!prof) return <div className="p-6" style={{ color: colors.danger }}>Profil professeur introuvable</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
        👋 Bonjour {prof.prenom} {prof.nom}
      </h1>

      {cours.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun cours assigné</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cours.map((c) => (
            <div
              key={c.id}
              className="rounded-lg shadow p-4 space-y-2"
              style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <h2 className="font-semibold text-lg" style={{ color: colors.text }}>
                {c.matiere} — {c.classe}
              </h2>

              <p className="text-sm" style={{ color: colors.textMuted }}>
                {c.date} | {c.heureDebut} - {c.heureFin}
              </p>

              <div className="flex gap-2 pt-2">
                <Link
                  to={`/prof/cours/${c.id}`}
                  className="px-3 py-1 rounded text-sm"
                  style={{ background: colors.text, color: colors.bg }}
                >
                  📋 Appel
                </Link>

                <Link
                  to={`/prof/cours/${c.id}?tab=cahier`}
                  className="px-3 py-1 rounded text-sm"
                  style={{ background: colors.primary, color: colors.onGradient }}
                >
                  📘 Cahier
                </Link>

                <Link
                  to={`/prof/cours/${c.id}?tab=exclusion`}
                  className="px-3 py-1 rounded text-sm"
                  style={{ background: colors.danger, color: colors.onGradient }}
                >
                  🚫 Exclure
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
