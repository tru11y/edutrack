import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { JOURS, GRADIENTS } from "../../../constants";
import type { ClasseData, ScheduleSlot, Matiere } from "../types";

interface Professeur {
  id: string;
  prenom: string;
  nom: string;
}

interface ScheduleModalProps {
  classe: ClasseData;
  matieres: Matiere[];
  professeurs: Professeur[];
  isAdmin: boolean;
  onClose: () => void;
  onAddSlot: (slot: ScheduleSlot) => Promise<void>;
  onRemoveSlot: (index: number) => Promise<void>;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(a: ScheduleSlot, b: ScheduleSlot): boolean {
  if (a.jour !== b.jour) return false;
  const aStart = timeToMinutes(a.heureDebut);
  const aEnd = timeToMinutes(a.heureFin);
  const bStart = timeToMinutes(b.heureDebut);
  const bEnd = timeToMinutes(b.heureFin);
  return aStart < bEnd && bStart < aEnd;
}

export function ScheduleModal({ classe, matieres, professeurs, isAdmin, onClose, onAddSlot, onRemoveSlot }: ScheduleModalProps) {
  const { colors } = useTheme();
  const [newSlot, setNewSlot] = useState<ScheduleSlot>({
    jour: "lundi",
    heureDebut: "08:00",
    heureFin: "09:00",
    matiere: "",
    profId: "",
    profNom: "",
  });
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!newSlot.matiere.trim()) return;

    if (newSlot.heureDebut >= newSlot.heureFin) {
      setError("L'heure de fin doit etre apres l'heure de debut.");
      return;
    }

    // Verifier les chevauchements
    const existingSlots = classe.emploiDuTemps || [];
    for (const slot of existingSlots) {
      if (hasOverlap(newSlot, slot)) {
        setError(`Conflit: un cours de ${slot.matiere} existe deja ${slot.heureDebut}-${slot.heureFin} ce jour.`);
        return;
      }
    }

    setError("");
    await onAddSlot(newSlot);
    setNewSlot({ jour: "lundi", heureDebut: "08:00", heureFin: "09:00", matiere: "", profId: "", profNom: "" });
  };

  const handleProfChange = (profId: string) => {
    const prof = professeurs.find((p) => p.id === profId);
    setNewSlot({
      ...newSlot,
      profId: profId,
      profNom: prof ? `${prof.prenom} ${prof.nom}` : "",
    });
  };

  const isAddDisabled = !newSlot.matiere.trim();

  const selectStyle = {
    padding: "10px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: colors.bgInput,
    color: colors.text,
  };

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

              {error && (
                <div style={{ padding: "8px 12px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: colors.danger, margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <select
                  value={newSlot.jour}
                  onChange={(e) => setNewSlot({ ...newSlot, jour: e.target.value as typeof newSlot.jour })}
                  style={selectStyle}
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
                  style={selectStyle}
                />
                <input
                  type="time"
                  value={newSlot.heureFin}
                  onChange={(e) => setNewSlot({ ...newSlot, heureFin: e.target.value })}
                  style={selectStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <select
                  value={newSlot.matiere}
                  onChange={(e) => setNewSlot({ ...newSlot, matiere: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Matiere *</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.nom}>
                      {m.nom}
                    </option>
                  ))}
                </select>
                <select
                  value={newSlot.profId || ""}
                  onChange={(e) => handleProfChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Professeur (optionnel)</option>
                  {professeurs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </select>
              </div>
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
