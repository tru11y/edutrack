import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { getPaiementsByEleve, getPaiementById, updatePaiement } from "../modules/paiements/paiement.service";
import { createPaiementSecure, ajouterVersementSecure, getCloudFunctionErrorMessage } from "../services/cloudFunctions";
import { logActivity } from "../services/activityLogger";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { Eleve } from "../modules/eleves/eleve.types";
import type { Paiement, MethodePaiement } from "../modules/paiements/paiement.types";

export default function PaiementForm() {
  const { colors } = useTheme();
  const { user } = useAuth();
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

  // Student search state
  const [searchQuery, setSearchQuery] = useState("");
  const [classeFilter, setClasseFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    eleveId: preselectedEleveId || "",
    mois: new Date().toISOString().slice(0, 7),
    montantTotal: 50000,
    montantPaye: 0,
    methode: "especes" as MethodePaiement,
    datePaiement: new Date().toISOString().slice(0, 10),
  });

  // Extract unique classes
  const classes = useMemo(() => {
    const set = new Set(eleves.map((e) => e.classe).filter(Boolean));
    return Array.from(set).sort();
  }, [eleves]);

  // Filter students by search + class
  const filteredEleves = useMemo(() => {
    let result = eleves;
    if (classeFilter) {
      result = result.filter((e) => e.classe === classeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
          `${e.nom} ${e.prenom}`.toLowerCase().includes(q) ||
          (e.matricule && e.matricule.toLowerCase().includes(q))
      );
    }
    return result;
  }, [eleves, searchQuery, classeFilter]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const elevesData = await getAllEleves();
        const active = elevesData.filter((e) => e.statut === "actif");
        setEleves(active);

        // Preselect if eleveId is provided
        if (preselectedEleveId) {
          const found = active.find((e) => e.id === preselectedEleveId);
          if (found) {
            setSelectedEleve(found);
            setSearchQuery(`${found.prenom} ${found.nom}`);
          }
        }

        if (id) {
          const paiement = await getPaiementById(id);
          if (paiement) {
            setForm({
              eleveId: paiement.eleveId || "",
              mois: paiement.mois || new Date().toISOString().slice(0, 7),
              montantTotal: paiement.montantTotal || 50000,
              montantPaye: paiement.montantPaye || 0,
              methode: "especes",
              datePaiement: new Date().toISOString().slice(0, 10),
            });
            const found = active.find((e) => e.id === paiement.eleveId);
            if (found) {
              setSelectedEleve(found);
              setSearchQuery(`${found.prenom} ${found.nom}`);
            }
          } else {
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
  }, [id, navigate, preselectedEleveId]);

  useEffect(() => {
    if (form.eleveId && !isEditing) {
      getPaiementsByEleve(form.eleveId)
        .then((data) => setPaiementsExistants(data.filter((p) => p.statut !== "paye")))
        .catch(console.error);
    } else {
      setPaiementsExistants([]);
    }
  }, [form.eleveId, isEditing]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectEleve = (eleve: Eleve) => {
    setSelectedEleve(eleve);
    setForm({ ...form, eleveId: eleve.id || "" });
    setSearchQuery(`${eleve.prenom} ${eleve.nom}`);
    setShowDropdown(false);
  };

  const handleClearEleve = () => {
    setSelectedEleve(null);
    setForm({ ...form, eleveId: "" });
    setSearchQuery("");
    setPaiementsExistants([]);
  };

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
          datePaiement: form.datePaiement,
        });
        const eleve = eleves.find((e) => e.id === form.eleveId);
        logActivity({ action: "payment_add", entity: "paiement", entityLabel: eleve ? `${eleve.prenom} ${eleve.nom}` : form.eleveId, details: `${form.montantTotal} FCFA — ${form.mois}` });
      } else if (mode === "versement" && selectedPaiement) {
        if (form.montantPaye <= 0) { setError("Montant invalide"); return; }
        if (!selectedPaiement.id) { setError("Paiement invalide"); return; }
        await ajouterVersementSecure({
          paiementId: selectedPaiement.id,
          montant: form.montantPaye,
          methode: form.methode,
          datePaiement: form.datePaiement,
        });
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

  const creatorName = user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.email?.split("@")[0] || "";

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.warning, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/paiements" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
          {isEditing ? "Modifier le paiement" : "Nouveau paiement"}
        </h1>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 32, maxWidth: 600 }}>
        {/* Info bar: who is registering */}
        {!isEditing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: colors.primaryBg, borderRadius: 10, marginBottom: 24, fontSize: 13, color: colors.primary }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM8 4C9.1 4 10 4.9 10 6C10 7.1 9.1 8 8 8C6.9 8 6 7.1 6 6C6 4.9 6.9 4 8 4ZM8 13C6.33 13 4.86 12.14 4 10.83C4.03 9.39 6.67 8.6 8 8.6C9.33 8.6 11.97 9.39 12 10.83C11.14 12.14 9.67 13 8 13Z" fill="currentColor"/></svg>
            <span>Enregistre par : <strong>{creatorName}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Student picker */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Eleve *</label>

            {isEditing ? (
              <div style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, background: colors.bg, color: colors.text, fontSize: 14 }}>
                {selectedEleve ? `${selectedEleve.prenom} ${selectedEleve.nom} - ${selectedEleve.classe}` : form.eleveId}
              </div>
            ) : (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                {/* Class filter chips */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setClasseFilter("")}
                    style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      border: `1px solid ${!classeFilter ? colors.primary : colors.border}`,
                      background: !classeFilter ? colors.primaryBg : "transparent",
                      color: !classeFilter ? colors.primary : colors.textMuted,
                    }}
                  >
                    Toutes
                  </button>
                  {classes.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClasseFilter(c)}
                      style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                        border: `1px solid ${classeFilter === c ? colors.primary : colors.border}`,
                        background: classeFilter === c ? colors.primaryBg : "transparent",
                        color: classeFilter === c ? colors.primary : colors.textMuted,
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      if (selectedEleve) {
                        setSelectedEleve(null);
                        setForm({ ...form, eleveId: "" });
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Rechercher un eleve par nom..."
                    style={{
                      width: "100%", padding: "12px 14px", paddingRight: selectedEleve ? 36 : 14,
                      border: `1px solid ${selectedEleve ? colors.success : colors.border}`,
                      borderRadius: 10, fontSize: 14, boxSizing: "border-box",
                      background: colors.bgCard, color: colors.text,
                    }}
                  />
                  {selectedEleve && (
                    <button
                      type="button"
                      onClick={handleClearEleve}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: colors.textMuted, fontSize: 18, lineHeight: 1, padding: 0,
                      }}
                    >
                      x
                    </button>
                  )}
                </div>

                {/* Selected indicator */}
                {selectedEleve && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.success }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.67 3.5L5.25 9.92L2.33 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {selectedEleve.prenom} {selectedEleve.nom} — {selectedEleve.classe}
                  </div>
                )}

                {/* Dropdown results */}
                {showDropdown && !selectedEleve && (
                  <div
                    style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      marginTop: 4, background: colors.bgCard,
                      border: `1px solid ${colors.border}`, borderRadius: 10,
                      maxHeight: 240, overflowY: "auto", zIndex: 20,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    }}
                  >
                    {filteredEleves.length === 0 ? (
                      <div style={{ padding: 16, textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
                        Aucun eleve trouve
                      </div>
                    ) : (
                      filteredEleves.slice(0, 50).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => handleSelectEleve(e)}
                          style={{
                            width: "100%", padding: "10px 14px", background: "transparent",
                            border: "none", borderBottom: `1px solid ${colors.border}`,
                            cursor: "pointer", textAlign: "left", display: "flex",
                            alignItems: "center", justifyContent: "space-between",
                          }}
                          onMouseEnter={(ev) => (ev.currentTarget.style.background = colors.bgHover)}
                          onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: colors.text }}>
                              {e.prenom} {e.nom}
                            </p>
                            {e.matricule && (
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted }}>{e.matricule}</p>
                            )}
                          </div>
                          <span style={{
                            padding: "3px 10px", background: colors.primaryBg,
                            color: colors.primary, borderRadius: 6, fontSize: 11, fontWeight: 500,
                          }}>
                            {e.classe}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isEditing && form.eleveId && paiementsExistants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Type</label>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => { setMode("nouveau"); setSelectedPaiement(null); }} style={{ flex: 1, padding: "12px 16px", background: mode === "nouveau" ? colors.warning : colors.bgSecondary, color: mode === "nouveau" ? colors.onGradient : colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Nouveau mois</button>
                <button type="button" onClick={() => setMode("versement")} style={{ flex: 1, padding: "12px 16px", background: mode === "versement" ? colors.warning : colors.bgSecondary, color: mode === "versement" ? colors.onGradient : colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Versement</button>
              </div>
            </div>
          )}

          {!isEditing && mode === "versement" && paiementsExistants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Paiement en attente</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {paiementsExistants.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedPaiement(p)} style={{ padding: 16, background: selectedPaiement?.id === p.id ? colors.warningBg : colors.bg, border: selectedPaiement?.id === p.id ? `2px solid ${colors.warning}` : `1px solid ${colors.border}`, borderRadius: 10, textAlign: "left", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><p style={{ margin: 0, fontWeight: 500, color: colors.text }}>{new Date(p.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p><p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>Reste: {p.montantRestant.toLocaleString()} FCFA</p></div>
                      <span style={{ padding: "4px 10px", background: p.statut === "partiel" ? colors.warningBg : colors.dangerBg, color: p.statut === "partiel" ? colors.warning : colors.danger, borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{p.statut === "partiel" ? "Partiel" : "Impaye"}</span>
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
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Mois *</label>
                    <input type="month" name="mois" value={form.mois} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Date de paiement *</label>
                    <input type="date" name="datePaiement" value={form.datePaiement} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} />
                  </div>
                </>
              )}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Montant total (FCFA)</label>
                <input type="number" name="montantTotal" value={form.montantTotal} onChange={handleChange} min="0" style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
              {isEditing ? "Montant paye (FCFA)" : mode === "nouveau" ? "Montant paye (FCFA)" : "Montant du versement (FCFA)"}
            </label>
            <input
              type="number"
              name="montantPaye"
              value={form.montantPaye}
              onChange={handleChange}
              min="0"
              max={mode === "versement" && selectedPaiement ? selectedPaiement.montantRestant : undefined}
              style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }}
            />
          </div>

          {!isEditing && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Methode</label>
              <select name="methode" value={form.methode} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgCard, boxSizing: "border-box", color: colors.text }}>
                <option value="especes">Especes</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}`, borderRadius: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving || (!isEditing && mode === "versement" && !selectedPaiement)}
              style={{ padding: "14px 28px", background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warning} 100%)`, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving || (!isEditing && mode === "versement" && !selectedPaiement) ? 0.7 : 1 }}
            >
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
