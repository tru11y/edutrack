import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCoursByProfesseur } from "../cours/cours.service";
import { Link } from "react-router-dom";
import ProfDashboardUX from "../../components/ux_dashboards_appleSchool/ProfDashboardUX";

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const [cours, setCours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.professeurId) return;

    getCoursByProfesseur(user.professeurId).then((data) => {
      setCours(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="space-y-6">

      {/* UX HEADER */}
      <ProfDashboardUX />

      {/* LISTE DES COURS */}
      <div className="p-6 bg-white rounded-xl shadow">

        <h2 className="text-lg font-bold mb-4">📚 Mes cours</h2>

        {cours.length === 0 ? (
          <p className="text-gray-500">Aucun cours assigné</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Matière</th>
                <th className="border p-2">Classe</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cours.map((c) => (
                <tr key={c.id}>
                  <td className="border p-2">{c.matiere}</td>
                  <td className="border p-2">{c.classe}</td>
                  <td className="border p-2">{c.date}</td>
                  <td className="border p-2">
                    <Link
                      to={`/prof/cours/${c.id}`}
                      className="text-blue-600 underline"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}
