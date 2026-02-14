import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import {
  getEvaluationsByClasseSecure,
  getNotesByEvaluationSecure,
  createNotesBatchSecure,
  getCloudFunctionErrorMessage,
  type EvaluationResult,
  type NoteResult,
} from "../../services/cloudFunctions";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

interface NoteRow {
  eleveId: string;
  eleveNom: string;
  note: number;
  commentaire: string;
  absence: boolean;
}

export default function NoteSaisie() {
  const { id: evaluationId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const toast = useToast();

  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (evaluationId) loadData();
  }, [evaluationId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load evaluation
      const evalRes = await getEvaluationsByClasseSecure({});
      const ev = evalRes.evaluations.find((e) => e.id === evaluationId);
      if (!ev) {
        toast.error("Evaluation non trouvee.");
        navigate("/evaluations");
        return;
      }
      setEvaluation(ev);

      // Load students in this class
      const elevesSnap = await getDocs(
        query(collection(db, "eleves"), where("classe", "==", ev.classe), where("statut", "==", "actif"))
      );
      const eleves = elevesSnap.docs.map((d) => ({
        id: d.id,
        nom: `${d.data().prenom} ${d.data().nom}`,
      })).sort((a, b) => a.nom.localeCompare(b.nom));

      // Load existing notes
      const notesRes = await getNotesByEvaluationSecure(evaluationId!);
      const existingNotes = notesRes.notes || [];
      const noteMap: Record<string, NoteResult> = {};
      for (const n of existingNotes) {
        noteMap[n.eleveId] = n;
      }

      // Build rows
      const noteRows: NoteRow[] = eleves.map((el) => {
        const existing = noteMap[el.id];
        return {
          eleveId: el.id,
          eleveNom: el.nom,
          note: existing ? existing.note : 0,
          commentaire: existing ? existing.commentaire : "",
          absence: existing ? existing.absence : false,
        };
      });

      setRows(noteRows);
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateRow(index: number, field: keyof NoteRow, value: unknown) {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "absence" && value === true) {
        updated[index].note = 0;
      }
      return updated;
    });
  }

  async function handleSave() {
    if (!evaluationId || !evaluation) return;
    setSaving(true);
    try {
      await createNotesBatchSecure({
        evaluationId,
        notes: rows.map((r) => ({
          eleveId: r.eleveId,
          eleveNom: r.eleveNom,
          note: r.note,
          commentaire: r.commentaire,
          absence: r.absence,
        })),
      });
      toast.success("Notes enregistrees.");
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>;
  }

  if (!evaluation) return null;

  // Stats
  const notesWithValues = rows.filter((r) => !r.absence);
  const avg = notesWithValues.length > 0
    ? notesWithValues.reduce((s, r) => s + r.note, 0) / notesWithValues.length
    : 0;
  const max = notesWithValues.length > 0 ? Math.max(...notesWithValues.map((r) => r.note)) : 0;
  const min = notesWithValues.length > 0 ? Math.min(...notesWithValues.map((r) => r.note)) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
            Saisie des notes
          </h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
            {evaluation.titre} — {evaluation.classe} — {evaluation.matiere} (/{evaluation.maxNote})
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/evaluations")} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.bgHover, color: colors.textMuted, cursor: "pointer", fontSize: 13,
          }}>
            Retour
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: colors.primary, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 500, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Enregistrement..." : "Enregistrer les notes"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 20, padding: 16, background: colors.bgCard,
        border: `1px solid ${colors.border}`, borderRadius: 12, flexWrap: "wrap",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Eleves</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{rows.length}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Moyenne</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>{avg.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Max</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.success }}>{max}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Min</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.danger }}>{min}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Absents</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.warning }}>{rows.filter((r) => r.absence).length}</div>
        </div>
      </div>

      {/* Notes table */}
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: colors.textMuted }}>Eleve</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: colors.textMuted, width: 100 }}>Note /{evaluation.maxNote}</th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: colors.textMuted, width: 80 }}>Absent</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: colors.textMuted }}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.eleveId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 16px", fontSize: 14, color: colors.text, fontWeight: 500 }}>
                  {row.eleveNom}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <input
                    type="number"
                    min={0}
                    max={evaluation.maxNote}
                    step={0.5}
                    value={row.absence ? "" : row.note}
                    disabled={row.absence}
                    onChange={(e) => updateRow(i, "note", parseFloat(e.target.value) || 0)}
                    style={{
                      width: 70, padding: "6px 8px", borderRadius: 6,
                      border: `1px solid ${colors.border}`, background: row.absence ? colors.bgHover : colors.bgCard,
                      color: colors.text, fontSize: 14, textAlign: "center",
                    }}
                  />
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={row.absence}
                    onChange={(e) => updateRow(i, "absence", e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <input
                    type="text"
                    value={row.commentaire}
                    onChange={(e) => updateRow(i, "commentaire", e.target.value)}
                    placeholder="Commentaire..."
                    style={{
                      width: "100%", padding: "6px 10px", borderRadius: 6,
                      border: `1px solid ${colors.border}`, background: colors.bgCard,
                      color: colors.text, fontSize: 13,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
