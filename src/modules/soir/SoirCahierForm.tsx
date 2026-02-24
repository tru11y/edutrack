import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, addDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { ALL_SOIR_CLASSES } from "./soir.constants";

interface CahierForm {
  classe: string;
  matiere: string;
  contenu: string;
  date: string;
}

const EMPTY: CahierForm = {
  classe: ALL_SOIR_CLASSES[0] || "",
  matiere: "",
  contenu: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function SoirCahierForm() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<CahierForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "cahier", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          classe: d.classe || ALL_SOIR_CLASSES[0] || "",
          matiere: d.matiere || "",
          contenu: d.contenu || "",
          date: d.date || EMPTY.date,
        });
      }
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classe || !form.matiere || !form.contenu) { setError("Classe, matière et contenu sont obligatoires."); return; }
    setSaving(true);
    setError("");
    try {
      const profName = user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.email;
      const payload = {
        ...form,
        programme: "soir",
        schoolId: schoolId || null,
        profId: user?.uid,
        profNom: profName,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && id) {
        await setDoc(doc(db, "cahier", id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "cahier"), { ...payload, createdAt: serverTimestamp() });
      }
      navigate("/cours-du-soir/cahier");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6, display: "block" };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginBottom: 24 }}>
        {isEditing ? "Modifier l'entrée" : "Nouvelle entrée — Cours du soir"}
      </h1>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Classe *</label>
              <select style={inputStyle} value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} required>
                {ALL_SOIR_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Matière *</label>
              <input style={inputStyle} value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} placeholder="Ex: Lecture, Calcul, Écriture..." required />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Contenu du cours *</label>
              <textarea
                style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
                value={form.contenu}
                onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                placeholder="Décrivez le contenu de la leçon..."
                required
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: colors.dangerBg, borderRadius: 8, marginTop: 16 }}>
              <p style={{ color: colors.danger, margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: 14, background: saving ? colors.border : colors.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer l'entrée"}
            </button>
            <button type="button" onClick={() => navigate("/cours-du-soir/cahier")} style={{ flex: 1, padding: 14, background: colors.bgHover, color: colors.textMuted, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
