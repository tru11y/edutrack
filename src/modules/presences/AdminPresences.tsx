import { useEffect, useState } from "react";
import { getAllPresences } from "./presence.service";

export default function AdminPresences() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPresences().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📋 Présences – Admin</h1>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Cours</th>
            <th className="border p-2">Classe</th>
            <th className="border p-2">Total élèves</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.date}</td>
              <td className="border p-2">{p.coursId}</td>
              <td className="border p-2">{p.classe}</td>
              <td className="border p-2">
                {p.presences?.length || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
