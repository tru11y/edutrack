import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import {
  getNotesByEleveSecure,
  getCloudFunctionErrorMessage,
  type NoteResult,
} from "../../services/cloudFunctions";
import { EVALUATION_TYPE_LABELS, TRIMESTRE_LABELS, type EvaluationType, type Trimestre } from "./notes.types";

interface NotesListProps {
  eleveId: string;
  trimestre?: number;
}

export default function NotesList({ eleveId, trimestre }: NotesListProps) {
  const { colors } = useTheme();
  const toast = useToast();
  const [notes, setNotes] = useState<NoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrimestre, setSelectedTrimestre] = useState<number | "">(trimestre || "");

  useEffect(() => {
    loadNotes();
  }, [eleveId, selectedTrimestre]);

  async function loadNotes() {
    setLoading(true);
    try {
      const params: { eleveId: string; trimestre?: number } = { eleveId };
      if (selectedTrimestre) params.trimestre = selectedTrimestre as number;
      const res = await getNotesByEleveSecure(params);
      setNotes(res.notes || []);
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Group notes by matiere
  const byMatiere: Record<string, NoteResult[]> = {};
  for (const note of notes) {
    const matiere = note.evaluation?.matiere || "Autre";
    if (!byMatiere[matiere]) byMatiere[matiere] = [];
    byMatiere[matiere].push(note);
  }

  const getMoyenne = (matNotes: NoteResult[]) => {
    const valid = matNotes.filter((n) => !n.absence && n.evaluation);
    if (valid.length === 0) return null;
    let totalPondere = 0;
    let totalCoef = 0;
    for (const n of valid) {
      const noteOn20 = (n.note / (n.evaluation?.maxNote || 20)) * 20;
      totalCoef += n.evaluation?.coefficient || 1;
      totalPondere += noteOn20 * (n.evaluation?.coefficient || 1);
    }
    return totalCoef > 0 ? Math.round((totalPondere / totalCoef) * 100) / 100 : 0;
  };

  const getMoyenneColor = (moy: number) => {
    if (moy >= 14) return colors.success;
    if (moy >= 10) return colors.primary;
    if (moy >= 8) return colors.warning;
    return colors.danger;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>Notes</h2>
        <select
          value={selectedTrimestre}
          onChange={(e) => setSelectedTrimestre(e.target.value ? Number(e.target.value) : "")}
          style={{
            padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
            background: colors.bgCard, color: colors.text, fontSize: 13,
          }}
        >
          <option value="">Tous les trimestres</option>
          {([1, 2, 3] as Trimestre[]).map((t) => (
            <option key={t} value={t}>{TRIMESTRE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 20, color: colors.textMuted }}>Chargement...</div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>
          Aucune note pour cet eleve.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(byMatiere).map(([matiere, matNotes]) => {
            const moy = getMoyenne(matNotes);
            return (
              <div key={matiere} style={{
                background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px", borderBottom: `1px solid ${colors.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{matiere}</span>
                  {moy !== null && (
                    <span style={{
                      padding: "4px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                      color: getMoyenneColor(moy), background: `${getMoyenneColor(moy)}15`,
                    }}>
                      Moy: {moy}/20
                    </span>
                  )}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 12, color: colors.textMuted }}>Evaluation</th>
                      <th style={{ padding: "8px 16px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Type</th>
                      <th style={{ padding: "8px 16px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Date</th>
                      <th style={{ padding: "8px 16px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Note</th>
                      <th style={{ padding: "8px 16px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Coef</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matNotes.map((note) => (
                      <tr key={note.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "8px 16px", fontSize: 13, color: colors.text }}>{note.evaluation?.titre}</td>
                        <td style={{ padding: "8px 16px", textAlign: "center" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 4, fontSize: 11,
                            background: colors.bgHover, color: colors.textMuted,
                          }}>
                            {EVALUATION_TYPE_LABELS[(note.evaluation?.type as EvaluationType) || "devoir"] || note.evaluation?.type}
                          </span>
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "center", fontSize: 13, color: colors.textMuted }}>{note.evaluation?.date}</td>
                        <td style={{ padding: "8px 16px", textAlign: "center" }}>
                          {note.absence ? (
                            <span style={{ color: colors.danger, fontSize: 12, fontWeight: 500 }}>Absent</span>
                          ) : (
                            <span style={{
                              fontWeight: 600, fontSize: 14,
                              color: (note.note / (note.evaluation?.maxNote || 20)) >= 0.5 ? colors.success : colors.danger,
                            }}>
                              {note.note}/{note.evaluation?.maxNote}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "center", fontSize: 13, color: colors.textMuted }}>{note.evaluation?.coefficient}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
