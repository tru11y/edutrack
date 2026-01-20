import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEleves } from "./eleve.service";
import type { Eleve } from "./eleve.types";

export default function ElevesList() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllEleves().then((data) => {
      setEleves(data.filter((e) => !!e.id));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">👨‍🎓 Élèves</h1>

        <Link
          to="/admin/eleves/create"
          className="bg-black text-white px-3 py-2 rounded"
        >
          ➕ Ajouter un élève
        </Link>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Nom</th>
            <th className="p-2 border">Prénom</th>
            <th className="p-2 border">Classe</th>
            <th className="p-2 border">Statut</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map((e) => (
            <tr key={e.id}>
              <td className="p-2 border">{e.nom}</td>
              <td className="p-2 border">{e.prenom}</td>
              <td className="p-2 border">{e.classe}</td>
              <td className="p-2 border">
                {e.isBanned ? (
                  <span className="text-red-600 font-bold">🚫 BANNI</span>
                ) : (
                  <span className="text-green-600">Actif</span>
                )}
              </td>
              <td className="p-2 border">
                <Link
                  to={`/admin/eleves/${e.id}`}
                  className="text-blue-600 underline"
                >
                  Voir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
