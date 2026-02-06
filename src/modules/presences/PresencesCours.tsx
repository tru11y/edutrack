import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPresencesByCours } from "./presence.service";
import { useTheme } from "../../context/ThemeContext";
import type { PresenceCoursPayload, PresenceItem } from "./presence.types";

export default function PresencesCours() {
  const { colors } = useTheme();
  const { id } = useParams();
  const [data, setData] = useState<PresenceCoursPayload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getPresencesByCours(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p style={{ color: colors.textMuted }} className="p-6">Chargement…</p>;
  if (data.length === 0) return <p style={{ color: colors.textMuted }} className="p-6">Aucune présence enregistrée</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold" style={{ color: colors.text }}>📋 Présences du cours</h1>

      {data.map((appel, idx) => (
        <div key={idx} className="p-4 rounded" style={{ border: `1px solid ${colors.border}`, background: colors.bgCard }}>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Date : {appel.date} — Classe : {appel.classe}
          </p>

          <table className="w-full mt-2" style={{ border: `1px solid ${colors.border}` }}>
            <thead style={{ background: colors.bgSecondary }}>
              <tr>
                <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Élève</th>
                <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Statut</th>
                <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Retard (min)</th>
              </tr>
            </thead>
            <tbody>
              {appel.presences.map((p: PresenceItem, i: number) => (
                <tr key={i} style={{ background: colors.bgCard }}>
                  <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.eleveId}</td>
                  <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.statut}</td>
                  <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.minutesRetard || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
