import { useTheme } from "../../../context/ThemeContext";
import type { ClasseData } from "../types";

interface ClassSelectorProps {
  availableClasses: ClasseData[];
  selectedClasses: string[];
  onToggle: (className: string) => void;
}

export function ClassSelector({ availableClasses, selectedClasses, onToggle }: ClassSelectorProps) {
  const { colors } = useTheme();

  if (availableClasses.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
        Classes enseignees
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {availableClasses.map((c) => {
          const isSelected = selectedClasses.includes(c.nom);
          return (
            <button
              key={c.nom}
              type="button"
              onClick={() => onToggle(c.nom)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                background: isSelected ? colors.primaryBg : colors.bgSecondary,
                color: isSelected ? colors.primary : colors.textMuted,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {c.nom}
            </button>
          );
        })}
      </div>
      {selectedClasses.length > 0 && (
        <p style={{ fontSize: 12, color: colors.textMuted, margin: "8px 0 0" }}>
          {selectedClasses.length} classe(s) selectionnee(s)
        </p>
      )}
    </div>
  );
}
