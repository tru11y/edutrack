import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { getCahierById, updateCahierEntry } from "../modules/cahier/cahier.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { Eleve } from "../modules/eleves/eleve.types";

export default function CahierForm() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const isProf = user?.role === "prof";
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    classe: "",
    contenu: "",
    devoirs: ""
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load eleves
        const elevesData = await getAllEleves();
        setEleves(elevesData.filter((e) => e.statut === "actif"));

        // Load existing cahier if editing
        if (id) {
          const cahier = await getCahierById(id);
          if (cahier) {
            if (cahier.isSigned) {
              alert("Cette entree est signee et ne peut plus etre modifiee");
              navigate("/cahier");
              return;
            }
            setForm({
              date: cahier.date || new Date().toISOString().split("T")[0],
              classe: cahier.classe || "",
              contenu: cahier.contenu || "",
              devoirs: cahier.devoirs || ""
            });
          } else {
            alert("Entree introuvable");
            navigate("/cahier");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))];
  const elevesClasse = eleves.filter((e) => e.classe === form.classe);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classe || !form.date) {
      setError("Classe et date obligatoires");
      return;
    }
    if (!form.contenu.trim() && !form.devoirs.trim()) {
      setError("Remplissez au moins le contenu ou les devoirs");
      return;
    }
    try {
      setSaving(true);
      setError("");

      if (isEditing && id) {
        // Update existing entry
        const updateData: Record<string, unknown> = {
          date: form.date,
          classe: form.classe,
        };
        if (form.contenu.trim()) {
          updateData.contenu = form.contenu.trim();
        }
        if (form.devoirs.trim()) {
          updateData.devoirs = form.devoirs.trim();
        }
        updateData.eleves = elevesClasse.map((e) => e.id || "");

        await updateCahierEntry(id, updateData);
      } else {
        // Create new entry
        const payload: Record<string, unknown> = {
          coursId: `cahier-${form.date}-${form.classe}`,
          classe: form.classe,
          date: form.date,
          profId: user?.uid || "",
          profNom: user?.email?.split("@")[0] || "Utilisateur",
          eleves: elevesClasse.map((e) => e.id || ""),
          isSigned: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (form.contenu.trim()) {
          payload.contenu = form.contenu.trim();
        }
        if (form.devoirs.trim()) {
          payload.devoirs = form.devoirs.trim();
        }

        await addDoc(collection(db, "cahier"), payload);
      }
      navigate("/cahier");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: isProf ? colors.success : colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/cahier" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
          {isEditing ? "Modifier l'entree" : "Nouvelle entree"}
        </h1>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 32, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Date *</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Classe *</label>
              <select name="classe" value={form.classe} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgCard, boxSizing: "border-box", color: colors.text }}>
                <option value="">Selectionner</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {form.classe && (
            <div style={{ padding: 16, background: colors.bg, borderRadius: 10, marginBottom: 24 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500, color: colors.text }}>
                {elevesClasse.length} eleve{elevesClasse.length > 1 ? "s" : ""} dans cette classe
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {elevesClasse.map((eleve) => (
                  <span key={eleve.id} style={{ padding: "6px 12px", background: eleve.sexe === "M" ? colors.maleBg : colors.femaleBg, color: eleve.sexe === "M" ? colors.maleText : colors.femaleText, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                    {isProf ? eleve.prenom : `${eleve.prenom} ${eleve.nom}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Contenu du cours</label>
            <textarea name="contenu" value={form.contenu} onChange={handleChange} rows={5} placeholder="Decrivez le contenu du cours..." style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", background: colors.bgCard, color: colors.text }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Devoirs</label>
            <textarea name="devoirs" value={form.devoirs} onChange={handleChange} rows={4} placeholder="Devoirs a faire pour la prochaine fois..." style={{ width: "100%", padding: "12px 14px", border: "1px solid #fde68a", borderRadius: 10, fontSize: 14, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", background: colors.warningBg, color: colors.text }} />
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}`, borderRadius: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={saving} style={{ padding: "14px 28px", background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Enregistrement..." : (isEditing ? "Mettre a jour" : "Enregistrer")}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: "14px 28px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
