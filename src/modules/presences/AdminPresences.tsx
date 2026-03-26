import { useEffect, useState } from "react";
import { getAllPresences } from "./presence.service";
import { useTheme } from "../../context/ThemeContext";
import type { PresenceCoursPayload } from "./presence.types";
import { logger } from "@/utils/logger";

export default function AdminPresences() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<PresenceCoursPayload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPresences().then((data) => {
      setRows(data);
      }).catch(logger.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6" style={{ color: colors.textMuted }}>Chargement…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: colors.text }}>📋 Présences – Admin</h1>

      <table className="w-full" style={{ border: `1px solid ${colors.border}` }}>
        <thead style={{ background: colors.bgSecondary }}>
          <tr>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Date</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Cours</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Classe</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Total élèves</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} style={{ background: colors.bgCard }}>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.date}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.coursId}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.classe}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>
                {p.presences?.length || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
