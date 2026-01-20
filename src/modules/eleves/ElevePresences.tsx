import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPresenceHistoryForEleve } from "../presences/presence.service";

export default function ElevePresences() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.eleveId) return;

    getPresenceHistoryForEleve(user.eleveId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;

  if (history.length === 0)
    return <div className="p-6 text-gray-500">Aucune présence enregistrée</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📋 Mes présences</h1>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Cours</th>
            <th className="border p-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => {
            const p = h.presences.find(
              (x: any) => x.eleveId === user!.eleveId
            );

            return (
              <tr key={h.id}>
                <td className="border p-2">{h.date}</td>
                <td className="border p-2">{h.coursId}</td>
                <td className="border p-2">
                  {p.statut === "present" && "✅ Présent"}
                  {p.statut === "absent" && "❌ Absent"}
                  {p.statut === "retard" &&
                    `⏰ Retard (${p.minutesRetard || 0} min)`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
