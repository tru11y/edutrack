import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { getPaiementsByEleve, enregistrerVersement, getPaiementById, updatePaiement } from "../modules/paiements/paiement.service";
import { createPaiementSecure, getCloudFunctionErrorMessage } from "../services/cloudFunctions";
import type { Eleve } from "../modules/eleves/eleve.types";
import type { Paiement, MethodePaiement } from "../modules/paiements/paiement.types";

export default function PaiementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [searchParams] = useSearchParams();
  const preselectedEleveId = searchParams.get("eleveId");
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"nouveau" | "versement">("nouveau");
  const [paiementsExistants, setPaiementsExistants] = useState<Paiement[]>([]);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [form, setForm] = useState({
    eleveId: preselectedEleveId || "",
    mois: new Date().toISOString().slice(0, 7),
    montantTotal: 50000,
    montantPaye: 0,
    methode: "especes" as MethodePaiement,
    datePaiement: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const elevesData = await getAllEleves();
        setEleves(elevesData.filter((e) => e.statut === "actif"));

        // Load existing paiement if editing
        if (id) {
          const paiement = await getPaiementById(id);
          if (paiement) {
            setForm({
              eleveId: paiement.eleveId || "",
              mois: paiement.mois || new Date().toISOString().slice(0, 7),
              montantTotal: paiement.montantTotal || 50000,
              montantPaye: paiement.montantPaye || 0,
              methode: "especes",
              datePaiement: new Date().toISOString().slice(0, 10)
            });
          } else {
            alert("Paiement introuvable");
            navigate("/paiements");
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

  useEffect(() => {
    if (form.eleveId && !isEditing) {
      getPaiementsByEleve(form.eleveId)
        .then((data) => setPaiementsExistants(data.filter((p) => p.statut !== "paye")))
        .catch(console.error);
    } else {
      setPaiementsExistants([]);
    }
  }, [form.eleveId, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name.includes("montant") ? parseInt(value) || 0 : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eleveId) { setError("Selectionnez un eleve"); return; }

    try {
      setSaving(true);
      setError("");

      if (isEditing && id) {
        // Update existing paiement
        const { statut, montantRestant } = calculateStatus(form.montantTotal, form.montantPaye);
        await updatePaiement(id, {
          montantTotal: form.montantTotal,
          montantPaye: form.montantPaye,
          montantRestant,
          statut,
        });
      } else if (mode === "nouveau") {
        if (!form.mois) { setError("Selectionnez un mois"); return; }
        if (!form.datePaiement) { setError("Selectionnez une date de paiement"); return; }
        await createPaiementSecure({
          eleveId: form.eleveId,
          mois: form.mois,
          montantTotal: form.montantTotal,
          montantPaye: form.montantPaye,
          datePaiement: form.datePaiement
        });
      } else if (mode === "versement" && selectedPaiement) {
        if (form.montantPaye <= 0) { setError("Montant invalide"); return; }
        await enregistrerVersement(selectedPaiement, form.montantPaye, form.methode);
      }
      navigate("/paiements");
    } catch (err: unknown) {
      console.error(err);
      setError(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const calculateStatus = (total: number, paye: number): { statut: "paye" | "partiel" | "impaye"; montantRestant: number } => {
    const montantRestant = total - paye;
    let statut: "paye" | "partiel" | "impaye" = "impaye";
    if (paye >= total) statut = "paye";
    else if (paye > 0) statut = "partiel";
    return { statut, montantRestant };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/paiements" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          {isEditing ? "Modifier le paiement" : "Nouveau paiement"}
        </h1>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Eleve *</label>
            <select
              name="eleveId"
              value={form.eleveId}
              onChange={handleChange}
              disabled={isEditing}
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: isEditing ? "#f8fafc" : "#fff", boxSizing: "border-box" }}
            >
              <option value="">Selectionner</option>
              {eleves.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom} - {e.classe}</option>)}
            </select>
          </div>

          {!isEditing && form.eleveId && paiementsExistants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Type</label>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => { setMode("nouveau"); setSelectedPaiement(null); }} style={{ flex: 1, padding: "12px 16px", background: mode === "nouveau" ? "#f59e0b" : "#f1f5f9", color: mode === "nouveau" ? "#fff" : "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Nouveau mois</button>
                <button type="button" onClick={() => setMode("versement")} style={{ flex: 1, padding: "12px 16px", background: mode === "versement" ? "#f59e0b" : "#f1f5f9", color: mode === "versement" ? "#fff" : "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Versement</button>
              </div>
            </div>
          )}

          {!isEditing && mode === "versement" && paiementsExistants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Paiement en attente</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {paiementsExistants.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedPaiement(p)} style={{ padding: 16, background: selectedPaiement?.id === p.id ? "#fffbeb" : "#f8fafc", border: selectedPaiement?.id === p.id ? "2px solid #f59e0b" : "1px solid #e2e8f0", borderRadius: 10, textAlign: "left", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><p style={{ margin: 0, fontWeight: 500, color: "#1e293b" }}>{new Date(p.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p><p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Reste: {p.montantRestant.toLocaleString()} FCFA</p></div>
                      <span style={{ padding: "4px 10px", background: p.statut === "partiel" ? "#fffbeb" : "#fef2f2", color: p.statut === "partiel" ? "#f59e0b" : "#ef4444", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{p.statut === "partiel" ? "Partiel" : "Impaye"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isEditing || mode === "nouveau") && (
            <>
              {!isEditing && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Mois *</label>
                    <input type="month" name="mois" value={form.mois} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Date de paiement *</label>
                    <input type="date" name="datePaiement" value={form.datePaiement} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                </>
              )}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Montant total (FCFA)</label>
                <input type="number" name="montantTotal" value={form.montantTotal} onChange={handleChange} min="0" style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
              {isEditing ? "Montant paye (FCFA)" : mode === "nouveau" ? "Montant paye (FCFA)" : "Montant du versement (FCFA)"}
            </label>
            <input
              type="number"
              name="montantPaye"
              value={form.montantPaye}
              onChange={handleChange}
              min="0"
              max={mode === "versement" && selectedPaiement ? selectedPaiement.montantRestant : undefined}
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          {!isEditing && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Methode</label>
              <select name="methode" value={form.methode} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", boxSizing: "border-box" }}>
                <option value="especes">Especes</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving || (!isEditing && mode === "versement" && !selectedPaiement)}
              style={{ padding: "14px 28px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving || (!isEditing && mode === "versement" && !selectedPaiement) ? 0.7 : 1 }}
            >
              {saving ? "Enregistrement..." : (isEditing ? "Mettre a jour" : "Enregistrer")}
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
