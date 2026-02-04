import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { JOURS, GRADIENTS } from "../../../constants";
import type { ClasseData, ScheduleSlot, Matiere } from "../types";

interface ScheduleModalProps {
  classe: ClasseData;
  matieres: Matiere[];
  isAdmin: boolean;
  onClose: () => void;
  onAddSlot: (slot: ScheduleSlot) => Promise<void>;
  onRemoveSlot: (index: number) => Promise<void>;
}

export function ScheduleModal({ classe, matieres, isAdmin, onClose, onAddSlot, onRemoveSlot }: ScheduleModalProps) {
  const { colors } = useTheme();
  const [newSlot, setNewSlot] = useState<ScheduleSlot>({
    jour: "lundi",
    heureDebut: "08:00",
    heureFin: "09:00",
    matiere: "",
    profNom: "",
  });

  const handleAdd = async () => {
    if (!newSlot.matiere.trim()) return;
    await onAddSlot(newSlot);
    setNewSlot({ jour: "lundi", heureDebut: "08:00", heureFin: "09:00", matiere: "", profNom: "" });
  };

  const isAddDisabled = !newSlot.matiere.trim();

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
          maxWidth: 700,
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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.text }}>Emploi du temps - {classe.nom}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>
              {classe.emploiDuTemps?.length || 0} cours programmes
            </p>
          </div>
          <button
            onClick={onClose}
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
          {/* Formulaire ajout */}
          {isAdmin && (
            <div style={{ background: colors.bgSecondary, borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: colors.text }}>Ajouter un cours</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr 2fr", gap: 12, marginBottom: 12 }}>
                <select
                  value={newSlot.jour}
                  onChange={(e) => setNewSlot({ ...newSlot, jour: e.target.value as typeof newSlot.jour })}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                >
                  {JOURS.map((j) => (
                    <option key={j} value={j}>
                      {j.charAt(0).toUpperCase() + j.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newSlot.heureDebut}
                  onChange={(e) => setNewSlot({ ...newSlot, heureDebut: e.target.value })}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                />
                <input
                  type="time"
                  value={newSlot.heureFin}
                  onChange={(e) => setNewSlot({ ...newSlot, heureFin: e.target.value })}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                />
                <select
                  value={newSlot.matiere}
                  onChange={(e) => setNewSlot({ ...newSlot, matiere: e.target.value })}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                >
                  <option value="">Matiere *</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.nom}>
                      {m.nom}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Professeur (optionnel)"
                  value={newSlot.profNom || ""}
                  onChange={(e) => setNewSlot({ ...newSlot, profNom: e.target.value })}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={isAddDisabled}
                style={{
                  padding: "10px 20px",
                  background: isAddDisabled ? colors.border : GRADIENTS.primary,
                  color: isAddDisabled ? colors.textMuted : "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isAddDisabled ? "not-allowed" : "pointer",
                }}
              >
                Ajouter
              </button>
            </div>
          )}

          {/* Liste par jour */}
          {JOURS.map((jour) => {
            const slots = (classe.emploiDuTemps || [])
              .map((slot, originalIndex) => ({ ...slot, originalIndex }))
              .filter((slot) => slot.jour === jour)
              .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

            if (slots.length === 0) return null;

            return (
              <div key={jour} style={{ marginBottom: 20 }}>
                <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>
                  {jour}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {slots.map((slot) => (
                    <div
                      key={slot.originalIndex}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary, minWidth: 100 }}>
                          {slot.heureDebut} - {slot.heureFin}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{slot.matiere}</span>
                        {slot.profNom && <span style={{ fontSize: 12, color: colors.textMuted }}>({slot.profNom})</span>}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onRemoveSlot(slot.originalIndex)}
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
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {(!classe.emploiDuTemps || classe.emploiDuTemps.length === 0) && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: colors.textMuted, margin: 0 }}>Aucun cours programme</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
