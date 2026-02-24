import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { ALL_SOIR_CLASSES } from "./soir.constants";

interface SoirEleveFormData {
  nom: string;
  prenom: string;
  classe: string;
  telephone: string;
  dateNaissance: string;
  sexe: string;
  notes: string;
}

const EMPTY: SoirEleveFormData = {
  nom: "",
  prenom: "",
  classe: ALL_SOIR_CLASSES[0] || "",
  telephone: "",
  dateNaissance: "",
  sexe: "",
  notes: "",
};

export default function SoirEleveForm() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<SoirEleveFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "eleves", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          nom: d.nom || "",
          prenom: d.prenom || "",
          classe: d.classe || ALL_SOIR_CLASSES[0] || "",
          telephone: d.telephone || "",
          dateNaissance: d.dateNaissance || "",
          sexe: d.sexe || "",
          notes: d.notes || "",
        });
      }
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.classe) { setError("Nom et classe sont obligatoires."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        programme: "soir",
        schoolId: schoolId || null,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && id) {
        await setDoc(doc(db, "eleves", id), { ...payload, updatedBy: user?.uid }, { merge: true });
      } else {
        await addDoc(collection(db, "eleves"), { ...payload, createdAt: serverTimestamp(), createdBy: user?.uid });
      }
      navigate("/cours-du-soir/eleves");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    fontSize: 14,
    background: colors.bgInput,
    color: colors.text,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginBottom: 24 }}>
        {isEditing ? "Modifier l'élève" : "Ajouter un élève — Cours du soir"}
      </h1>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input style={inputStyle} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Ex: Aminata" />
            </div>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input style={inputStyle} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Diallo" required />
            </div>

            <div>
              <label style={labelStyle}>Classe *</label>
              <select style={inputStyle} value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} required>
                {ALL_SOIR_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Sexe</label>
              <select style={inputStyle} value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}>
                <option value="">Non précisé</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+237 6XX XXX XXX" />
            </div>

            <div>
              <label style={labelStyle}>Date de naissance</label>
              <input type="date" style={inputStyle} value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes ou informations complémentaires..."
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, marginTop: 16 }}>
              <p style={{ color: colors.danger, margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, padding: 14, background: saving ? colors.border : colors.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Enregistrement..." : isEditing ? "Enregistrer" : "Ajouter l'élève"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/cours-du-soir/eleves")}
              style={{ flex: 1, padding: 14, background: colors.bgHover, color: colors.textMuted, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
