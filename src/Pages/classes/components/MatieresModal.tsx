import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { GRADIENTS } from "../../../constants";
import type { Matiere } from "../types";

interface MatieresModalProps {
  matieres: Matiere[];
  onClose: () => void;
  onAdd: (data: { nom: string; description: string }) => Promise<void>;
  onUpdate: (matiere: Matiere) => Promise<void>;
  onDelete: (matiere: Matiere) => void;
}

export function MatieresModal({ matieres, onClose, onAdd, onUpdate, onDelete }: MatieresModalProps) {
  const { colors } = useTheme();
  const [newMatiere, setNewMatiere] = useState({ nom: "", description: "" });
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);

  const handleAdd = async () => {
    if (!newMatiere.nom.trim()) return;
    await onAdd(newMatiere);
    setNewMatiere({ nom: "", description: "" });
  };

  const handleUpdate = async () => {
    if (!editingMatiere?.nom.trim()) return;
    await onUpdate(editingMatiere);
    setEditingMatiere(null);
  };

  const isAddDisabled = !newMatiere.nom.trim();
  const isUpdateDisabled = !editingMatiere?.nom.trim();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: colors.bgCard,
          borderRadius: 16,
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.text }}>Gestion des matieres</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>{matieres.length} matiere(s)</p>
          </div>
          <button
            onClick={() => {
              onClose();
              setEditingMatiere(null);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: colors.bgSecondary,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.textMuted,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* Formulaire */}
          <div style={{ background: colors.bgSecondary, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: colors.text }}>
              {editingMatiere ? "Modifier la matiere" : "Ajouter une matiere"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Nom de la matiere *"
                value={editingMatiere ? editingMatiere.nom : newMatiere.nom}
                onChange={(e) =>
                  editingMatiere
                    ? setEditingMatiere({ ...editingMatiere, nom: e.target.value })
                    : setNewMatiere({ ...newMatiere, nom: e.target.value })
                }
                style={{
                  padding: "12px 14px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: colors.bgInput,
                  color: colors.text,
                }}
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={editingMatiere ? editingMatiere.description || "" : newMatiere.description}
                onChange={(e) =>
                  editingMatiere
                    ? setEditingMatiere({ ...editingMatiere, description: e.target.value })
                    : setNewMatiere({ ...newMatiere, description: e.target.value })
                }
                style={{
                  padding: "12px 14px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: colors.bgInput,
                  color: colors.text,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                {editingMatiere ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdateDisabled}
                      style={{
                        flex: 1,
                        padding: "10px 20px",
                        background: isUpdateDisabled ? colors.border : GRADIENTS.primary,
                        color: isUpdateDisabled ? colors.textMuted : colors.onGradient,
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: isUpdateDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingMatiere(null)}
                      style={{
                        padding: "10px 20px",
                        background: colors.bgSecondary,
                        color: colors.textMuted,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAdd}
                    disabled={isAddDisabled}
                    style={{
                      padding: "10px 20px",
                      background: isAddDisabled ? colors.border : GRADIENTS.primary,
                      color: isAddDisabled ? colors.textMuted : colors.onGradient,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: isAddDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    Ajouter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Liste */}
          {matieres.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: colors.textMuted, margin: 0 }}>Aucune matiere enregistree</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {matieres.map((matiere) => (
                <div
                  key={matiere.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: colors.bgSecondary,
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: colors.text }}>{matiere.nom}</p>
                    {matiere.description && (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted }}>{matiere.description}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setEditingMatiere(matiere)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: colors.primaryBg,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.primary,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M10.08 1.75L12.25 3.92M1.75 12.25L2.33 9.92L10.5 1.75L12.25 3.5L4.08 11.67L1.75 12.25Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(matiere)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: colors.dangerBg,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.danger,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
