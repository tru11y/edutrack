import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { createEleve, getEleveById, updateEleve } from "../modules/eleves/eleve.service";
import { useTheme } from "../context/ThemeContext";
import type { ParentContact } from "../modules/eleves/eleve.types";

export default function EleveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { colors } = useTheme();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<string[]>([]);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    sexe: "M" as "M" | "F",
    classe: "",
    matricule: "",
    ecoleOrigine: "",
    quartier: "",
    commune: "",
    ville: "",
  });

  // Charger les classes
  useEffect(() => {
    const loadClasses = async () => {
      const snap = await getDocs(collection(db, "classes"));
      const classNames = snap.docs.map(d => d.data().nom as string).filter(Boolean).sort();
      setClasses(classNames);
    };
    loadClasses();
  }, []);

  const [parents, setParents] = useState<ParentContact[]>([
    { nom: "", telephone: "", lien: "pere" },
  ]);

  useEffect(() => {
    if (isEdit && id) {
      getEleveById(id).then((data) => {
        if (data) {
          setForm({
            nom: data.nom || "",
            prenom: data.prenom || "",
            sexe: data.sexe || "M",
            classe: data.classe || "",
            matricule: data.matricule || "",
            ecoleOrigine: data.ecoleOrigine || "",
            quartier: data.adresse?.quartier || "",
            commune: data.adresse?.commune || "",
            ville: data.adresse?.ville || "",
          });
          if (data.parents && data.parents.length > 0) {
            setParents(data.parents);
          }
        }
        setLoadingData(false);
      });
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleParentChange = (index: number, field: keyof ParentContact, value: string) => {
    const updated = [...parents];
    updated[index] = { ...updated[index], [field]: value };
    setParents(updated);
  };

  const addParent = () => {
    if (parents.length < 3) {
      setParents([...parents, { nom: "", telephone: "", lien: "tuteur" }]);
    }
  };

  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(parents.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom.trim() || !form.prenom.trim() || !form.classe.trim()) {
      setError("Le nom, prenom et classe sont obligatoires");
      return;
    }

    // Validate parents - at least one complete parent required
    const validParents = parents.filter((p) => p.nom.trim() && p.telephone.trim());

    if (validParents.length === 0) {
      setError("Au moins un parent avec nom et telephone est requis");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Build payload without undefined values
      const payload: Record<string, unknown> = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        sexe: form.sexe,
        classe: form.classe.trim(),
        parents: validParents,
        statut: "actif",
      };

      // Only add optional fields if they have values
      if (form.matricule.trim()) {
        payload.matricule = form.matricule.trim();
      }

      if (form.ecoleOrigine.trim()) {
        payload.ecoleOrigine = form.ecoleOrigine.trim();
      }

      // Build adresse only if at least one field has value
      const adresse: Record<string, string> = {};
      if (form.quartier.trim()) adresse.quartier = form.quartier.trim();
      if (form.commune.trim()) adresse.commune = form.commune.trim();
      if (form.ville.trim()) adresse.ville = form.ville.trim();
      if (Object.keys(adresse).length > 0) {
        payload.adresse = adresse;
      }

      if (isEdit && id) {
        await updateEleve(id, payload);
      } else {
        await createEleve(payload);
      }

      navigate("/eleves");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/eleves" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour aux eleves
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>{isEdit ? "Modifier l'eleve" : "Nouvel eleve"}</h1>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 32, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Informations personnelles</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Prenom *</label>
              <input type="text" name="prenom" value={form.prenom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Nom *</label>
              <input type="text" name="nom" value={form.nom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Sexe</label>
              <select name="sexe" value={form.sexe} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Matricule</label>
            <input type="text" name="matricule" value={form.matricule} onChange={handleChange} placeholder="Ex: 2024-001" style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Scolarite</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Classe *</label>
              <select name="classe" value={form.classe} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}>
                <option value="">Selectionner une classe</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Ecole d'origine</label>
              <input type="text" name="ecoleOrigine" value={form.ecoleOrigine} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Adresse</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Quartier</label>
              <input type="text" name="quartier" value={form.quartier} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Commune</label>
              <input type="text" name="commune" value={form.commune} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Ville</label>
              <input type="text" name="ville" value={form.ville} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>Parents / Tuteurs</h2>
            {parents.length < 3 && (
              <button type="button" onClick={addParent} style={{ padding: "8px 16px", background: colors.bgSecondary, color: colors.textSecondary, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                + Ajouter un parent
              </button>
            )}
          </div>

          {parents.map((parent, index) => (
            <div key={index} style={{ padding: 20, background: colors.bgSecondary, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: colors.textSecondary }}>Parent {index + 1}</span>
                {parents.length > 1 && (
                  <button type="button" onClick={() => removeParent(index)} style={{ padding: "4px 12px", background: colors.dangerBg, color: colors.danger, border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Supprimer</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>Nom</label>
                  <input type="text" value={parent.nom} onChange={(e) => handleParentChange(index, "nom", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>Telephone</label>
                  <input type="tel" value={parent.telephone} onChange={(e) => handleParentChange(index, "telephone", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>Lien</label>
                  <select value={parent.lien} onChange={(e) => handleParentChange(index, "lien", e.target.value as "pere" | "mere" | "tuteur")} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}>
                    <option value="pere">Pere</option>
                    <option value="mere">Mere</option>
                    <option value="tuteur">Tuteur</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}30`, borderRadius: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button type="submit" disabled={loading} style={{ padding: "14px 28px", background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Enregistrement..." : isEdit ? "Mettre a jour" : "Creer l'eleve"}
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
