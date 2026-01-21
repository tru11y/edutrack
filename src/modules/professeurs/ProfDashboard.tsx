import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProfesseurById } from "./professeur.service";
import { getCoursByProfesseur } from "../cours/cours.service";

export default function ProfesseurDashboard() {
  const { user } = useAuth();

  const [prof, setProf] = useState<any>(null);
  const [cours, setCours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !user.professeurId) return;

      const p = await getProfesseurById(user.professeurId);
      if (!p) {
        setLoading(false);
        return;
      }

      const c = await getCoursByProfesseur(p.id!);
      setProf(p);
      setCours(c);
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!prof) return <div className="p-6 text-red-600">Profil professeur introuvable</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        👋 Bonjour {prof.prenom} {prof.nom}
      </h1>

      {cours.length === 0 ? (
        <p className="text-gray-500">Aucun cours assigné</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cours.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow p-4 space-y-2"
            >
              <h2 className="font-semibold text-lg">
                {c.nom} — {c.classe}
              </h2>

              <p className="text-sm text-gray-600">
                {c.description || "—"}
              </p>

              <div className="flex gap-2 pt-2">
                <Link
                  to={`/prof/cours/${c.id}`}
                  className="px-3 py-1 bg-black text-white rounded text-sm"
                >
                  📋 Appel
                </Link>

                <Link
                  to={`/prof/cours/${c.id}?tab=cahier`}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  📘 Cahier
                </Link>

                <Link
                  to={`/prof/cours/${c.id}?tab=exclusion`}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
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
