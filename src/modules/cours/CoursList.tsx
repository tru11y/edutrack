import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCours } from "./cours.service";
import { useTheme } from "../../context/ThemeContext";
import type { Cours } from "./cours.types";

export default function CoursList() {
  const { colors } = useTheme();
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

  if (loading) return <div className="p-6" style={{ color: colors.textMuted }}>Chargement…</div>;
  if (error) return <div className="p-6" style={{ color: colors.danger }}>{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold" style={{ color: colors.text }}>📚 Cours</h1>

        <Link
          to="/admin/cours/create"
          className="px-3 py-2 rounded"
          style={{ background: colors.text, color: colors.bg }}
        >
          ➕ Ajouter un cours
        </Link>
      </div>

      {cours.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun cours enregistré</p>
      ) : (
        <table className="w-full" style={{ border: `1px solid ${colors.border}` }}>
          <thead style={{ background: colors.bgSecondary }}>
            <tr>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Classe</th>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Matière</th>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Date</th>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Statut</th>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cours.map((c) => (
              <tr key={c.id!} style={{ background: colors.bgCard }}>
                <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{c.classe}</td>
                <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{c.matiere}</td>
                <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{c.date}</td>
                <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{c.statut}</td>
                <td className="p-2" style={{ border: `1px solid ${colors.border}` }}>
                  <Link
                    to={`/admin/cours/${c.id}`}
                    style={{ color: colors.primary, textDecoration: "underline" }}
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
