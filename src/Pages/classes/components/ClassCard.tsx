import { Link } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { GRADIENTS, GENDER_COLORS } from "../../../constants";
import type { ClasseData, ScheduleSlot } from "../types";

interface ClassCardProps {
  classe: ClasseData;
  elevesCount: number;
  garcons: number;
  filles: number;
  todaysCourses: ScheduleSlot[];
  isAdmin: boolean;
  onOpenSchedule: () => void;
  onDelete: () => void;
}

export function ClassCard({
  classe,
  elevesCount,
  garcons,
  filles,
  todaysCourses,
  isAdmin,
  onOpenSchedule,
  onDelete,
}: ClassCardProps) {
  const { colors } = useTheme();

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: GRADIENTS.primary,
                color: colors.onGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {classe.nom.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 18, color: colors.text }}>{classe.nom}</p>
              {classe.niveau && <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{classe.niveau}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {classe.id && isAdmin && (
              <button
                onClick={onOpenSchedule}
                title="Emploi du temps"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: colors.primaryBg,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.primary,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 6H14M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {elevesCount === 0 && classe.id && isAdmin && (
              <button
                onClick={onDelete}
                title="Supprimer"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: colors.dangerBg,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.danger,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4H14M5.33 4V2.67C5.33 2.3 5.63 2 6 2H10C10.37 2 10.67 2.3 10.67 2.67V4M6.67 7.33V11.33M9.33 7.33V11.33M3.33 4L4 13.33C4 13.7 4.3 14 4.67 14H11.33C11.7 14 12 13.7 12 13.33L12.67 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: colors.bgSecondary, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>{elevesCount}</p>
            <p style={{ fontSize: 11, color: colors.textMuted, margin: "4px 0 0" }}>Eleves</p>
          </div>
          <div style={{ background: GENDER_COLORS.male.bg, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: GENDER_COLORS.male.text, margin: 0 }}>{garcons}</p>
            <p style={{ fontSize: 11, color: GENDER_COLORS.male.text, margin: "4px 0 0" }}>Garcons</p>
          </div>
          <div style={{ background: GENDER_COLORS.female.bg, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: GENDER_COLORS.female.text, margin: 0 }}>{filles}</p>
            <p style={{ fontSize: 11, color: GENDER_COLORS.female.text, margin: "4px 0 0" }}>Filles</p>
          </div>
        </div>

        {/* Cours du jour */}
        {todaysCourses.length > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: colors.successBg,
              borderRadius: 10,
              border: `1px solid ${colors.success}30`,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.success, margin: "0 0 8px", textTransform: "uppercase" }}>
              Cours aujourd'hui
            </p>
            {todaysCourses.map((slot, idx) => (
              <div key={idx} style={{ fontSize: 12, color: colors.text, marginBottom: idx < todaysCourses.length - 1 ? 4 : 0 }}>
                <span style={{ fontWeight: 500 }}>
                  {slot.heureDebut}-{slot.heureFin}
                </span>
                : {slot.matiere}
                {slot.profNom && <span style={{ color: colors.textMuted }}> ({slot.profNom})</span>}
              </div>
            ))}
          </div>
        )}

        {classe.description && (
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "16px 0 0", fontStyle: "italic" }}>{classe.description}</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", borderTop: `1px solid ${colors.border}` }}>
        <Link
          to={`/eleves?classe=${encodeURIComponent(classe.nom)}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 16px",
            background: colors.bgSecondary,
            color: colors.primary,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Voir les eleves
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {classe.id && (
          <button
            onClick={onOpenSchedule}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "12px 16px",
              background: colors.bgSecondary,
              borderLeft: `1px solid ${colors.border}`,
              color: colors.textMuted,
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 6H14M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Emploi
          </button>
        )}
      </div>
    </div>
  );
}
