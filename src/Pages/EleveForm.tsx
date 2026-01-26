import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createEleve, getEleveById, updateEleve } from "../modules/eleves/eleve.service";
import type { ParentContact } from "../modules/eleves/eleve.types";

export default function EleveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    sexe: "M" as "M" | "F",
    classe: "",
    ecoleOrigine: "",
    quartier: "",
    commune: "",
    ville: "",
  });

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

    const validParents = parents.filter((p) => p.nom.trim() && p.telephone.trim());

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
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/eleves" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour aux eleves
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>{isEdit ? "Modifier l'eleve" : "Nouvel eleve"}</h1>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>Informations personnelles</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Prenom *</label>
              <input type="text" name="prenom" value={form.prenom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Nom *</label>
              <input type="text" name="nom" value={form.nom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Sexe</label>
              <select name="sexe" value={form.sexe} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", boxSizing: "border-box" }}>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>Scolarite</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Classe *</label>
              <input type="text" name="classe" value={form.classe} onChange={handleChange} placeholder="Ex: 6eme A" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Ecole d'origine</label>
              <input type="text" name="ecoleOrigine" value={form.ecoleOrigine} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>Adresse</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Quartier</label>
              <input type="text" name="quartier" value={form.quartier} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Commune</label>
              <input type="text" name="commune" value={form.commune} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Ville</label>
              <input type="text" name="ville" value={form.ville} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: 0 }}>Parents / Tuteurs</h2>
            {parents.length < 3 && (
              <button type="button" onClick={addParent} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                + Ajouter un parent
              </button>
            )}
          </div>

          {parents.map((parent, index) => (
            <div key={index} style={{ padding: 20, background: "#f8fafc", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#475569" }}>Parent {index + 1}</span>
                {parents.length > 1 && (
                  <button type="button" onClick={() => removeParent(index)} style={{ padding: "4px 12px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Supprimer</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Nom</label>
                  <input type="text" value={parent.nom} onChange={(e) => handleParentChange(index, "nom", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Telephone</label>
                  <input type="tel" value={parent.telephone} onChange={(e) => handleParentChange(index, "telephone", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Lien</label>
                  <select value={parent.lien} onChange={(e) => handleParentChange(index, "lien", e.target.value as "pere" | "mere" | "tuteur")} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff", boxSizing: "border-box" }}>
                    <option value="pere">Pere</option>
                    <option value="mere">Mere</option>
                    <option value="tuteur">Tuteur</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button type="submit" disabled={loading} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Enregistrement..." : isEdit ? "Mettre a jour" : "Creer l'eleve"}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: "14px 28px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
