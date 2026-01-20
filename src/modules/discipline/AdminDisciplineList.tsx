import { useEffect, useState } from "react";
import { getAllDiscipline } from "./discipline.service";
import { exportDisciplinePDF } from "./discipline.pdf";

export default function AdminDisciplineList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDiscipline().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleExport = () => {
    exportDisciplinePDF(data);
  };

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📕 Registre disciplinaire</h1>

        <button
          onClick={handleExport}
          className="bg-black text-white px-3 py-2 rounded"
        >
          📄 Export PDF
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Élève</th>
            <th className="p-2 border">Classe</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Source</th>
          </tr>
        </thead>

        <tbody>
          {data.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">
                {r.createdAt?.toDate?.().toLocaleDateString() || "-"}
              </td>
              <td className="p-2 border">
                {r.elevePrenom} {r.eleveNom}
              </td>
              <td className="p-2 border">{r.classe}</td>
              <td className="p-2 border">{r.type}</td>
              <td className="p-2 border">{r.description}</td>
              <td className="p-2 border">
                {r.isSystem ? "⚙️ Système" : "👨‍🏫 Prof"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
