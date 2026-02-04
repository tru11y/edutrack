import { useTheme } from "../../../context/ThemeContext";
import { GENDER_COLORS } from "../../../constants";

interface GenderStatsCardProps {
  totalEleves: number;
  totalGarcons: number;
  totalFilles: number;
}

export function GenderStatsCard({ totalEleves, totalGarcons, totalFilles }: GenderStatsCardProps) {
  const { colors } = useTheme();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Total eleves</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>{totalEleves}</p>
      </div>
      <div style={{ background: GENDER_COLORS.male.bg, borderRadius: 12, padding: 20, border: `1px solid ${GENDER_COLORS.male.border}` }}>
        <p style={{ fontSize: 13, color: GENDER_COLORS.male.text, margin: "0 0 8px" }}>Garcons</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: GENDER_COLORS.male.textDark, margin: 0 }}>{totalGarcons}</p>
      </div>
      <div style={{ background: GENDER_COLORS.female.bg, borderRadius: 12, padding: 20, border: `1px solid ${GENDER_COLORS.female.border}` }}>
        <p style={{ fontSize: 13, color: GENDER_COLORS.female.text, margin: "0 0 8px" }}>Filles</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: GENDER_COLORS.female.textDark, margin: 0 }}>{totalFilles}</p>
      </div>
    </div>
  );
}
