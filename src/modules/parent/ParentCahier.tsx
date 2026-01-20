import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllCahiers } from "../cahier/cahier.service";

export default function ParentCahier() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    getAllCahiers().then((d) => {
      setEntries(d);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">
        📘 Cahier de texte
      </h1>

      {entries.length === 0 ? (
        <p className="text-gray-500">
          Aucun cours publié
        </p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Cours</th>
              <th className="border p-2">Contenu</th>
              <th className="border p-2">Devoirs</th>
            </tr>
          </thead>

          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="border p-2">{e.date}</td>
                <td className="border p-2">{e.coursId}</td>
                <td className="border p-2">
                  {e.contenu}
                </td>
                <td className="border p-2">
                  {e.devoirs || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
