import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPresencesByCours } from "./presence.service";

export default function PresencesCours() {
  const { id } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getPresencesByCours(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p>Chargement…</p>;
  if (data.length === 0) return <p>Aucune présence enregistrée</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">📋 Présences du cours</h1>

      {data.map((appel, idx) => (
        <div key={idx} className="border p-4 rounded">
          <p className="text-sm text-gray-500">
            Date : {appel.date} — Classe : {appel.classe}
          </p>

          <table className="w-full mt-2 border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Élève</th>
                <th className="border p-2">Statut</th>
                <th className="border p-2">Retard (min)</th>
              </tr>
            </thead>
            <tbody>
              {appel.presences.map((p: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{p.eleveId}</td>
                  <td className="border p-2">{p.statut}</td>
                  <td className="border p-2">{p.minutesRetard || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
