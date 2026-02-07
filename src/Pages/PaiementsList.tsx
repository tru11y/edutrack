import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPaiements, movePaiementToTrash } from "../modules/paiements/paiement.service";
import { useTheme } from "../context/ThemeContext";
import type { Paiement } from "../modules/paiements/paiement.types";

export default function PaiementsList() {
  const { colors } = useTheme();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterMois, setFilterMois] = useState("");

  const loadPaiements = async () => {
    try {
      const data = await getAllPaiements();
      setPaiements(data.sort((a, b) => b.mois.localeCompare(a.mois)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaiements();
  }, []);

  const handleDelete = async (paiement: Paiement) => {
    if (!paiement.id) return;
    if (!window.confirm(`Supprimer le paiement de ${paiement.eleveNom} pour ${new Date(paiement.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} ?\n\nIl sera deplace dans la corbeille.`)) return;
    try {
      await movePaiementToTrash(paiement.id);
      await loadPaiements();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const mois = [...new Set(paiements.map((p) => p.mois))].sort().reverse();
  const filtered = paiements.filter((p) => {
    const matchSearch = !search || p.eleveNom?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || p.statut === filterStatut;
    const matchMois = !filterMois || p.mois === filterMois;
    return matchSearch && matchStatut && matchMois;
  });
  const stats = { total: paiements.reduce((acc, p) => acc + (p.montantTotal || 0), 0), paye: paiements.reduce((acc, p) => acc + (p.montantPaye || 0), 0), impaye: paiements.reduce((acc, p) => acc + (p.montantRestant || 0), 0) };

  if (loading) {
    return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}><div style={{ textAlign: "center" }}><div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.warning, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.warningBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.warning }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 10H22" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div><h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Paiements</h1><p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{paiements.length} enregistrement{paiements.length > 1 ? "s" : ""}</p></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/corbeille" style={{ padding: "12px 20px", background: colors.bgSecondary, color: colors.textMuted, borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2.25 4.5H15.75M6.75 4.5V3C6.75 2.17 7.42 1.5 8.25 1.5H9.75C10.58 1.5 11.25 2.17 11.25 3V4.5M7.5 8.25V12.75M10.5 8.25V12.75M3.75 4.5L4.5 15C4.5 15.83 5.17 16.5 6 16.5H12C12.83 16.5 13.5 15.83 13.5 15L14.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Corbeille
            </Link>
            <Link to="/paiements/nouveau" style={{ padding: "12px 20px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Nouveau
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}><p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Total attendu</p><p style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>{stats.total.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>FCFA</span></p></div>
        <div style={{ background: colors.successBg, borderRadius: 12, padding: 20, border: "1px solid #a7f3d0" }}><p style={{ fontSize: 13, color: colors.success, margin: "0 0 8px" }}>Total paye</p><p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0 }}>{stats.paye.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>FCFA</span></p></div>
        <div style={{ background: colors.dangerBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.danger}` }}><p style={{ fontSize: 13, color: colors.danger, margin: "0 0 8px" }}>Reste a payer</p><p style={{ fontSize: 24, fontWeight: 700, color: colors.danger, margin: 0 }}>{stats.impaye.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>FCFA</span></p></div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Rechercher un eleve..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, outline: "none", background: colors.bgCard, color: colors.text }}
        />
        <select value={filterMois} onChange={(e) => setFilterMois(e.target.value)} aria-label="Filtrer par mois" style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgCard, minWidth: 200, color: colors.text }}><option value="">Tous les mois</option>{mois.map((m) => <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</option>)}</select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} aria-label="Filtrer par statut" style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgCard, minWidth: 160, color: colors.text }}><option value="">Tous les statuts</option><option value="paye">Paye</option><option value="partiel">Partiel</option><option value="impaye">Impaye</option></select>
        {(search || filterMois || filterStatut) && (
          <button
            onClick={() => { setSearch(""); setFilterMois(""); setFilterStatut(""); }}
            style={{ padding: "12px 16px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer" }}
          >
            Effacer
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}><p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{paiements.length === 0 ? "Aucun paiement" : "Aucun paiement trouve"}</p></div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: colors.bg }}><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Eleve</th><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Mois</th><th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Montant</th><th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Paye</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Statut</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "16px 20px" }}><p style={{ margin: 0, fontWeight: 500, color: colors.text }}>{p.eleveNom}</p></td>
                  <td style={{ padding: "16px 20px", color: colors.textMuted, fontSize: 14 }}>{new Date(p.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 500, color: colors.text }}>{(p.montantTotal || 0).toLocaleString()} FCFA</td>
                  <td style={{ padding: "16px 20px", textAlign: "right", color: colors.success, fontWeight: 500 }}>{(p.montantPaye || 0).toLocaleString()} FCFA</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><span style={{ padding: "4px 12px", background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg, color: p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger, borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{p.statut === "paye" ? "Paye" : p.statut === "partiel" ? "Partiel" : "Impaye"}</span></td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <Link to={`/paiements/${p.id}/modifier`} style={{ padding: "6px 12px", background: colors.primaryBg, color: colors.primary, borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Modifier</Link>
                      <button onClick={() => handleDelete(p)} style={{ padding: "6px 12px", background: colors.dangerBg, color: colors.danger, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
