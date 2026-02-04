import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { GRADIENTS } from "../../../constants";

interface ClassFormProps {
  onSubmit: (data: { nom: string; niveau: string; description: string }) => Promise<void>;
  onCancel: () => void;
  existingNames: string[];
}

export function ClassForm({ onSubmit, onCancel, existingNames }: ClassFormProps) {
  const { colors } = useTheme();
  const [form, setForm] = useState({ nom: "", niveau: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) return;

    if (existingNames.some((c) => c.toLowerCase() === form.nom.trim().toLowerCase())) {
      alert("Cette classe existe deja");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
      setForm({ nom: "", niveau: "", description: "" });
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving || !form.nom.trim();

  return (
    <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Ajouter une classe</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
              Nom de la classe *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: CP, CE1, 6eme..."
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box",
                background: colors.bgInput,
                color: colors.text,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
              Niveau
            </label>
            <input
              type="text"
              value={form.niveau}
              onChange={(e) => setForm({ ...form, niveau: e.target.value })}
              placeholder="Ex: Primaire, College..."
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box",
                background: colors.bgInput,
                color: colors.text,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description optionnelle"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box",
                background: colors.bgInput,
                color: colors.text,
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={isDisabled}
            style={{
              padding: "12px 24px",
              background: isDisabled ? colors.border : GRADIENTS.primary,
              color: isDisabled ? colors.textMuted : "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Enregistrement..." : "Ajouter la classe"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              background: colors.bgSecondary,
              color: colors.textMuted,
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
