import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { GRADIENTS } from "../../../constants";
import { ClassSelector } from "./ClassSelector";
import type { ClasseData, UserData } from "../types";

interface EditUserModalProps {
  user: UserData;
  isAdmin: boolean;
  availableClasses: ClasseData[];
  onClose: () => void;
  onSubmit: (userId: string, data: { nom: string; prenom: string; role: string; classesEnseignees: string[] }) => Promise<void>;
}

export function EditUserModal({ user, isAdmin, availableClasses, onClose, onSubmit }: EditUserModalProps) {
  const { colors } = useTheme();
  const [form, setForm] = useState({
    nom: user.nom || "",
    prenom: user.prenom || "",
    role: user.role,
    classesEnseignees: user.classesEnseignees || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleClass = (className: string) => {
    if (form.classesEnseignees.includes(className)) {
      setForm({ ...form, classesEnseignees: form.classesEnseignees.filter((c) => c !== className) });
    } else {
      setForm({ ...form, classesEnseignees: [...form.classesEnseignees, className] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(user.id, {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        role: form.role,
        classesEnseignees: form.role === "prof" ? form.classesEnseignees : [],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bgCard,
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>Modifier l'utilisateur</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 24px" }}>{user.email}</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                Prenom
              </label>
              <input
                type="text"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
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
                Nom
              </label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
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
            >
              <option value="prof">Professeur</option>
              <option value="gestionnaire">Gestionnaire</option>
              {isAdmin && <option value="admin">Administrateur</option>}
            </select>
          </div>

          {form.role === "prof" && (
            <ClassSelector availableClasses={availableClasses} selectedClasses={form.classesEnseignees} onToggle={toggleClass} />
          )}

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: colors.dangerBg,
                border: `1px solid ${colors.danger}30`,
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: "14px",
                background: GRADIENTS.primary,
                color: colors.onGradient,
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
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
    </div>
  );
}
