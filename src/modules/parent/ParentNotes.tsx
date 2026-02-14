import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotesList from "../notes/NotesList";

export default function ParentNotes() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const enfantsIds = user?.enfantsIds || [];
  const [selectedEnfant, setSelectedEnfant] = useState(enfantsIds[0] || "");

  if (enfantsIds.length === 0) {
    return <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Aucun enfant associe.</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Notes de mon enfant</h1>
        {enfantsIds.length > 1 && (
          <select
            value={selectedEnfant}
            onChange={(e) => setSelectedEnfant(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
              background: colors.bgCard, color: colors.text, fontSize: 13,
            }}
          >
            {enfantsIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}
      </div>
      <NotesList eleveId={selectedEnfant} />
    </div>
  );
}
