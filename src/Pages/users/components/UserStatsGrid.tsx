import { useTheme } from "../../../context/ThemeContext";
import { ROLE_CONFIG } from "../../../constants";

interface UserStatsGridProps {
  admins: number;
  gestionnaires: number;
  profs: number;
}

export function UserStatsGrid({ admins, gestionnaires, profs }: UserStatsGridProps) {
  const { colors } = useTheme();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
      <div
        style={{
          background: ROLE_CONFIG.admin.bg,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${ROLE_CONFIG.admin.color}40`,
        }}
      >
        <p style={{ fontSize: 13, color: ROLE_CONFIG.admin.color, margin: "0 0 8px" }}>Administrateurs</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: colors.primary, margin: 0 }}>{admins}</p>
      </div>
      <div
        style={{
          background: ROLE_CONFIG.gestionnaire.bg,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${ROLE_CONFIG.gestionnaire.color}40`,
        }}
      >
        <p style={{ fontSize: 13, color: ROLE_CONFIG.gestionnaire.color, margin: "0 0 8px" }}>Gestionnaires</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: colors.warning, margin: 0 }}>{gestionnaires}</p>
      </div>
      <div
        style={{
          background: ROLE_CONFIG.prof.bg,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${ROLE_CONFIG.prof.color}40`,
        }}
      >
        <p style={{ fontSize: 13, color: ROLE_CONFIG.prof.color, margin: "0 0 8px" }}>Professeurs</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: colors.success, margin: 0 }}>{profs}</p>
      </div>
    </div>
  );
}
