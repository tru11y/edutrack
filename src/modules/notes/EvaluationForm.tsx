import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import {
  createEvaluationSecure,
  updateEvaluationSecure,
  getEvaluationsByClasseSecure,
  getCloudFunctionErrorMessage,
} from "../../services/cloudFunctions";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Trimestre, EvaluationType } from "./notes.types";

export default function EvaluationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const toast = useToast();
  const isEdit = !!id;

  const [classes, setClasses] = useState<string[]>([]);
  const [matieres, setMatieres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    classe: "",
    matiere: "",
    titre: "",
    type: "devoir" as EvaluationType,
    date: new Date().toISOString().split("T")[0],
    trimestre: 1 as Trimestre,
    coefficient: 1,
    maxNote: 20,
  });

  useEffect(() => {
    loadClasses();
    loadMatieres();
    if (isEdit) loadEvaluation();
  }, [id]);

  async function loadClasses() {
    const snap = await getDocs(collection(db, "classes"));
    setClasses(snap.docs.map((d) => d.data().nom || d.id).sort());
  }

  async function loadMatieres() {
    const snap = await getDocs(collection(db, "matieres"));
    setMatieres(snap.docs.map((d) => d.data().nom || d.id).sort());
  }

  async function loadEvaluation() {
    try {
      const res = await getEvaluationsByClasseSecure({});
      const ev = res.evaluations.find((e) => e.id === id);
      if (ev) {
        setForm({
          classe: ev.classe,
          matiere: ev.matiere,
          titre: ev.titre,
          type: ev.type,
          date: ev.date,
          trimestre: ev.trimestre,
          coefficient: ev.coefficient,
          maxNote: ev.maxNote,
        });
      }
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.classe || !form.matiere || !form.titre) {
      toast.warning("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateEvaluationSecure({ id: id!, ...form });
        toast.success("Evaluation modifiee.");
      } else {
        await createEvaluationSecure(form);
        toast.success("Evaluation creee.");
      }
      navigate("/evaluations");
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1px solid ${colors.border}`, background: colors.bgCard,
    color: colors.text, fontSize: 14, boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 13, fontWeight: 500 as const, color: colors.textMuted,
    marginBottom: 4, display: "block" as const,
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 24 }}>
        {isEdit ? "Modifier l'evaluation" : "Nouvelle evaluation"}
      </h1>

      <form onSubmit={handleSubmit} style={{
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: 12, padding: 24, maxWidth: 600,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Classe *</label>
            <select value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} style={inputStyle}>
              <option value="">Selectionnez</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matiere *</label>
            <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} style={inputStyle}>
              <option value="">Selectionnez</option>
              {matieres.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Titre *</label>
          <input type="text" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} style={inputStyle} placeholder="Ex: Devoir de mathematiques #1" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EvaluationType })} style={inputStyle}>
              <option value="devoir">Devoir</option>
              <option value="examen">Examen</option>
              <option value="interro">Interrogation</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Trimestre</label>
            <select value={form.trimestre} onChange={(e) => setForm({ ...form, trimestre: Number(e.target.value) as Trimestre })} style={inputStyle}>
              <option value={1}>1er Trimestre</option>
              <option value={2}>2eme Trimestre</option>
              <option value={3}>3eme Trimestre</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Coefficient</label>
            <input type="number" min="0.5" step="0.5" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: parseFloat(e.target.value) || 1 })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Note max</label>
            <input type="number" min="1" value={form.maxNote} onChange={(e) => setForm({ ...form, maxNote: parseInt(e.target.value) || 20 })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => navigate("/evaluations")} style={{
            padding: "10px 20px", borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.bgHover, color: colors.textMuted, cursor: "pointer", fontSize: 14,
          }}>
            Annuler
          </button>
          <button type="submit" disabled={saving} style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: colors.primary, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 500, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Enregistrement..." : isEdit ? "Modifier" : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
