import { useEffect, useState } from "react";
import { getAllDiscipline } from "./discipline.service";
import { exportDisciplinePDF } from "./discipline.pdf";
import { useTheme } from "../../context/ThemeContext";
import type { DisciplineRecord } from "./discipline.types";

export default function AdminDisciplineList() {
  const { colors } = useTheme();
  const [data, setData] = useState<DisciplineRecord[]>([]);
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

  if (loading) return <div className="p-6" style={{ color: colors.text }}>Chargement…</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold" style={{ color: colors.text }}>Registre disciplinaire</h1>

        <button
          onClick={handleExport}
          style={{ background: colors.primary, color: colors.onGradient, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}
        >
          Export PDF
        </button>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: colors.bgSecondary }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>Date</th>
              <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>Élève</th>
              <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>Classe</th>
              <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>Type</th>
              <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>Description</th>
              <th style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>Source</th>
            </tr>
          </thead>

          <tbody>
            {data.map((r, idx) => (
              <tr key={r.id} style={{ borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                <td style={{ padding: 12, color: colors.text }}>
                  {r.createdAt?.toDate?.().toLocaleDateString() || "-"}
                </td>
                <td style={{ padding: 12, color: colors.text }}>
                  {r.elevePrenom} {r.eleveNom}
                </td>
                <td style={{ padding: 12, color: colors.text }}>{r.classe}</td>
                <td style={{ padding: 12, color: colors.text }}>{r.type}</td>
                <td style={{ padding: 12, color: colors.text }}>{r.description}</td>
                <td style={{ padding: 12, color: colors.textMuted }}>
                  {r.isSystem ? "Système" : "Prof"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
