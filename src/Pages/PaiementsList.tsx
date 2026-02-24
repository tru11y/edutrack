import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Timestamp, addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { getAllPaiements, movePaiementToTrash } from "../modules/paiements/paiement.service";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast, ConfirmModal } from "../components/ui";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { useSchool } from "../context/SchoolContext";
import { exportPaiementsExcelSecure } from "../services/cloudFunctions";
import { downloadBase64File } from "../utils/download";
import { exportToCSV } from "../utils/csvExport";
import { exportRecuPaiementPDF } from "../modules/paiements/paiement.pdf";
import type { Paiement } from "../modules/paiements/paiement.types";

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "object" && "seconds" in val) return new Date((val as { seconds: number }).seconds * 1000);
  if (typeof val === "string") return new Date(val);
  return null;
}

function formatDate(val: unknown): string {
  const d = toDate(val);
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function PaiementsList() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const { schoolId } = useTenant();
  const { user } = useAuth();
  const { school } = useSchool();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterMois, setFilterMois] = useState("");
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  const loadPaiements = async () => {
    try {
      const data = await getAllPaiements(schoolId);
      setPaiements(data.sort((a, b) => b.mois.localeCompare(a.mois)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadPaiements();
  }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (paiement: Paiement) => {
    if (!paiement.id) return;
    const moisLabel = new Date(paiement.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    setConfirmState({
      isOpen: true, title: "Supprimer le paiement", message: `Supprimer le paiement de ${paiement.eleveNom} pour ${moisLabel} ?\n\nIl sera deplace dans la corbeille.`, variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try {
          await movePaiementToTrash(paiement.id!);
          await loadPaiements();
          toast.success("Paiement deplace dans la corbeille");
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleDownloadPDF = async (p: Paiement) => {
    if (!p.id) return;
    setPdfLoading(p.id);
    try {
      const generatedByName =
        user?.prenom && user?.nom
          ? `${user.prenom} ${user.nom}`.trim()
          : user?.email || "Administration";

      // Fetch eleve to get prénom and classe
      let elevePrenom = "";
      let classe = "";
      if (p.eleveId) {
        try {
          const eleveSnap = await getDoc(doc(db, "eleves", p.eleveId));
          if (eleveSnap.exists()) {
            const eleveData = eleveSnap.data();
            elevePrenom = eleveData.prenom || "";
            classe = eleveData.classe || "";
          }
        } catch { /* use empty strings if fetch fails */ }
      }

      const filename = exportRecuPaiementPDF(p, {
        eleveNom: p.eleveNom,
        elevePrenom,
        classe,
        generatedByName,
        adminNom: generatedByName,
        schoolName: school?.schoolName,
        schoolAdresse: school?.adresse,
        schoolTelephone: school?.telephone,
        schoolEmail: school?.email,
        primaryColor: school?.primaryColor,
        schoolLogo: school?.schoolLogo,
      });

      await addDoc(collection(db, "sauvegardes"), {
        type: "recu_paiement",
        fichier: filename,
        paiementId: p.id,
        reference: p.reference || null,
        eleveId: p.eleveId,
        eleveNom: p.eleveNom,
        mois: p.mois,
        montantPaye: p.montantPaye,
        montantTotal: p.montantTotal,
        statut: p.statut,
        schoolId,
        generatedAt: serverTimestamp(),
        generatedBy: user?.uid || null,
        generatedByName,
      });

      toast.success("Reçu PDF généré");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setPdfLoading(null);
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
            <button
              onClick={async () => {
                setExporting(true);
                try {
                  const res = await exportPaiementsExcelSecure({ mois: filterMois || undefined });
                  downloadBase64File(res.data, res.filename);
                  toast.success("Export telecharge");
                } catch { toast.error("Erreur lors de l'export"); }
                finally { setExporting(false); }
              }}
              disabled={exporting}
              style={{ padding: "12px 20px", background: colors.bgSecondary, color: colors.textMuted, borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.75 11.25V14.25C15.75 15.08 15.08 15.75 14.25 15.75H3.75C2.92 15.75 2.25 15.08 2.25 14.25V11.25M5.25 7.5L9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {exporting ? "Export..." : "Exporter"}
            </button>
            <button
              onClick={() => exportToCSV(filtered, [
                { header: "Eleve", accessor: (r) => r.eleveNom || "" },
                { header: "Mois", accessor: (r) => r.mois },
                { header: "Montant Total", accessor: (r) => r.montantTotal },
                { header: "Montant Paye", accessor: (r) => r.montantPaye },
                { header: "Reste", accessor: (r) => r.montantTotal - r.montantPaye },
                { header: "Statut", accessor: (r) => r.montantPaye >= r.montantTotal ? "Paye" : r.montantPaye > 0 ? "Partiel" : "Impaye" },
              ], `paiements_${filterMois || "tous"}.csv`)}
              style={{ padding: "12px 20px", background: colors.bgSecondary, color: colors.textMuted, borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.75 11.25V14.25C15.75 15.08 15.08 15.75 14.25 15.75H3.75C2.92 15.75 2.25 15.08 2.25 14.25V11.25M5.25 7.5L9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t("exportCSV")}
            </button>
            <Link to="/corbeille" style={{ padding: "12px 20px", background: colors.bgSecondary, color: colors.textMuted, borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2.25 4.5H15.75M6.75 4.5V3C6.75 2.17 7.42 1.5 8.25 1.5H9.75C10.58 1.5 11.25 2.17 11.25 3V4.5M7.5 8.25V12.75M10.5 8.25V12.75M3.75 4.5L4.5 15C4.5 15.83 5.17 16.5 6 16.5H12C12.83 16.5 13.5 15.83 13.5 15L14.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Corbeille
            </Link>
            <Link to="/paiements/nouveau" style={{ padding: "12px 20px", background: colors.warning, color: colors.bgCard, borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Nouveau
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}><p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Total attendu</p><p style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>{stats.total.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>FCFA</span></p></div>
        <div style={{ background: colors.successBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.success}40` }}><p style={{ fontSize: 13, color: colors.success, margin: "0 0 8px" }}>Total paye</p><p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0 }}>{stats.paye.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>FCFA</span></p></div>
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
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead><tr style={{ background: colors.bg }}><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Ref</th><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Eleve</th><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Mois</th><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Date</th><th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Montant</th><th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Paye</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Statut</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "16px 20px", maxWidth: 100 }}><span style={{ fontSize: 12, fontFamily: "monospace", color: colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{p.reference || "—"}</span></td>
                  <td style={{ padding: "16px 20px", maxWidth: 180 }}><p style={{ margin: 0, fontWeight: 500, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.eleveNom}</p></td>
                  <td style={{ padding: "16px 20px", color: colors.textMuted, fontSize: 14 }}>{new Date(p.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                  <td style={{ padding: "16px 20px", color: colors.text, fontSize: 14 }}>{formatDate(p.datePaiement)}</td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 500, color: colors.text }}>{(p.montantTotal || 0).toLocaleString()} FCFA</td>
                  <td style={{ padding: "16px 20px", textAlign: "right", color: colors.success, fontWeight: 500 }}>{(p.montantPaye || 0).toLocaleString()} FCFA</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><span style={{ padding: "4px 12px", background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg, color: p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger, borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{p.statut === "paye" ? "Paye" : p.statut === "partiel" ? "Partiel" : "Impaye"}</span></td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => handleDownloadPDF(p)}
                        disabled={pdfLoading === p.id}
                        style={{ padding: "6px 12px", background: colors.infoBg, color: colors.info, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: pdfLoading === p.id ? "not-allowed" : "pointer", opacity: pdfLoading === p.id ? 0.7 : 1 }}
                      >
                        {pdfLoading === p.id ? "..." : "Reçu PDF"}
                      </button>
                      <Link to={`/paiements/${p.id}/modifier`} style={{ padding: "6px 12px", background: colors.primaryBg, color: colors.primary, borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Modifier</Link>
                      <button onClick={() => handleDelete(p)} style={{ padding: "6px 12px", background: colors.dangerBg, color: colors.danger, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  );
}
