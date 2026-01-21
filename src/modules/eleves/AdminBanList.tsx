import { useEffect, useState } from "react";
import { getElevesBannis } from "./eleve.service";
import { unbanEleve } from "../paiements/paiement.service";

export default function AdminBansList() {
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getElevesBannis()
      .then(setEleves)
      .finally(() => setLoading(false));
  }, []);

  const handleUnban = async (eleveId: string) => {
    const confirm = window.confirm(
      "Lever le bannissement de cet élève ?"
    );

    if (!confirm) return;

    await unbanEleve(eleveId);

    setEleves((prev) =>
      prev.filter((e) => e.id !== eleveId)
    );

    alert("Élève réactivé");
  };

  if (loading) {
    return <div className="p-6">Chargement…</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">🚫 Élèves bannis</h1>

      {eleves.length === 0 ? (
        <p className="text-gray-500">
          Aucun élève banni
        </p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Nom</th>
              <th className="border p-2">Classe</th>
              <th className="border p-2">Raison</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {eleves.map((e) => (
              <tr key={e.id}>
                <td className="border p-2">
                  {e.prenom} {e.nom}
                </td>
                <td className="border p-2">
                  {e.classe}
                </td>
                <td className="border p-2 text-sm text-red-600">
                  {e.banReason || "—"}
                </td>
                <td className="border p-2 text-sm">
                  {e.banDate?.toDate
                    ? e.banDate.toDate().toLocaleDateString()
                    : "—"}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleUnban(e.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    🔓 Débannir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
