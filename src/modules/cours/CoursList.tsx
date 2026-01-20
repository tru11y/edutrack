import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCours } from "./cours.service";
import type { Cours } from "./cours.types";

export default function CoursList() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllCours();
        setCours(data.filter((c) => !!c.id));
      } catch {
        setError("Impossible de charger les cours");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📚 Cours</h1>

        <Link
          to="/admin/cours/create"
          className="bg-black text-white px-3 py-2 rounded"
        >
          ➕ Ajouter un cours
        </Link>
      </div>

      {cours.length === 0 ? (
        <p className="text-gray-500">Aucun cours enregistré</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Classe</th>
              <th className="p-2 border">Matière</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Statut</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cours.map((c) => (
              <tr key={c.id!}>
                <td className="p-2 border">{c.classe}</td>
                <td className="p-2 border">{c.matiere}</td>
                <td className="p-2 border">{c.date}</td>
                <td className="p-2 border">{c.statut}</td>
                <td className="p-2 border">
                  <Link
                    to={`/admin/cours/${c.id}`}
                    className="text-blue-600 underline"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
