import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";

interface PlatformStats {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  totalEleves: number;
  planCounts: Record<string, number>;
}

export default function SuperAdminDashboard() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fn = httpsCallable(functions, "getSchoolsStats");
    fn()
      .then((res) => {
        const data = res.data as { success: boolean; stats: PlatformStats };
        setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Ecoles", value: stats.totalSchools, color: colors.primary },
    { label: "Ecoles actives", value: stats.activeSchools, color: colors.success },
    { label: "Utilisateurs", value: stats.totalUsers, color: colors.warning },
    { label: "Eleves", value: stats.totalEleves, color: colors.info },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 24 }}>
        Super Admin Dashboard
      </h1>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            {statCards.map((card) => (
              <div key={card.label} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{card.label}</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: card.color, margin: "8px 0 0" }}>{card.value}</p>
              </div>
            ))}
          </div>

          {stats?.planCounts && (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Repartition par plan</h2>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {Object.entries(stats.planCounts).map(([plan, count]) => (
                  <div key={plan} style={{ padding: "8px 16px", background: colors.bgHover, borderRadius: 8 }}>
                    <span style={{ fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>{plan}</span>
                    <span style={{ marginLeft: 8, color: colors.textMuted }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
