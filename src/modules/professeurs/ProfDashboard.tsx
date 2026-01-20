import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCoursByProfesseur } from "../cours/cours.prof.service";
import type { Cours } from "../cours/cours.types";

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.professeurId) return;

    getCoursByProfesseur(user.professeurId)
      .then(setCours)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">👨‍🏫 Mes cours</h1>

      {cours.length === 0 ? (
        <p className="text-gray-500">Aucun cours assigné</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cours.map((c) => (
            <div
              key={c.id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <h2 className="font-semibold">
                  {c.matiere} — {c.classe}
                </h2>
                <p className="text-sm text-gray-500">
                  {c.date} · {c.heureDebut}–{c.heureFin}
                </p>
              </div>

              <Link
                to={`/prof/cours/${c.id}`}
                className="bg-black text-white px-3 py-2 rounded"
              >
                Ouvrir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
