import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getPresenceHistoryForEleve } from "../presences/presence.service";
import type { PresenceCoursPayload } from "../presences/presence.types";

export default function ParentPresences() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [history, setHistory] = useState<PresenceCoursPayload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    getPresenceHistoryForEleve(user.uid).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-6" style={{ color: colors.textMuted }}>Chargement…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
        📋 Présences
      </h1>

      {history.length === 0 ? (
        <p style={{ color: colors.textMuted }}>
          Aucune présence enregistrée
        </p>
      ) : (
        <table className="w-full" style={{ border: `1px solid ${colors.border}` }}>
          <thead style={{ background: colors.bgSecondary }}>
            <tr>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Date</th>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Cours</th>
              <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Statut</th>
            </tr>
          </thead>

          <tbody>
            {history.map((h) => {
              const p = h.presences.find(
                (x) => x.eleveId === user!.eleveId
              );
              if (!p) return null;

              return (
                <tr key={h.id} style={{ background: colors.bgCard }}>
                  <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{h.date}</td>
                  <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{h.coursId}</td>
                  <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>
                    {p.statut === "present" && "Présent"}
                    {p.statut === "absent" && "Absent"}
                    {p.statut === "retard" &&
                      `Retard (${p.minutesRetard || 0} min)`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
