import { useEffect, useState } from "react";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { getAllPresences } from "../modules/presences/presence.service";
import { getAllPaiements } from "../modules/paiements/paiement.service";
import type { Eleve } from "../modules/eleves/eleve.types";
import type { PresenceCoursPayload } from "../modules/presences/presence.types";
import type { Paiement } from "../modules/paiements/paiement.types";

interface EleveStats { eleve: Eleve; presences: number; absences: number; retards: number; tauxPresence: number; paiements: { total: number; paye: number; statut: string }; }

export default function Stats() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [presences, setPresences] = useState<PresenceCoursPayload[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");

  useEffect(() => {
    Promise.all([getAllEleves(), getAllPresences(), getAllPaiements()]).then(([e, p, pa]) => { setEleves(e); setPresences(p); setPaiements(pa); setLoading(false); }).catch((err) => { console.error(err); setLoading(false); });
  }, []);

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))];

  const getEleveStats = (eleve: Eleve): EleveStats => {
    let presencesCount = 0, absencesCount = 0, retardsCount = 0;
    presences.forEach((p) => { const item = p.presences?.find((i) => i.eleveId === eleve.id); if (item) { if (item.statut === "present") presencesCount++; else if (item.statut === "absent") absencesCount++; else if (item.statut === "retard") retardsCount++; } });
    const total = presencesCount + absencesCount + retardsCount;
    const tauxPresence = total > 0 ? Math.round(((presencesCount + retardsCount) / total) * 100) : 0;
    const elevePaiements = paiements.filter((p) => p.eleveId === eleve.id);
    const totalPaiement = elevePaiements.reduce((acc, p) => acc + p.montantTotal, 0);
    const payePaiement = elevePaiements.reduce((acc, p) => acc + p.montantPaye, 0);
    const hasImpaye = elevePaiements.some((p) => p.statut === "impaye");
    const hasPartiel = elevePaiements.some((p) => p.statut === "partiel");
    return { eleve, presences: presencesCount, absences: absencesCount, retards: retardsCount, tauxPresence, paiements: { total: totalPaiement, paye: payePaiement, statut: hasImpaye ? "impaye" : hasPartiel ? "partiel" : "ok" } };
  };

  const filteredEleves = eleves.filter((e) => !filterClasse || e.classe === filterClasse);
  const statsEleves = filteredEleves.map(getEleveStats);
  const globalStats = { totalEleves: eleves.length, elevesActifs: eleves.filter((e) => e.statut === "actif").length, totalPresences: presences.length, tauxPresenceMoyen: statsEleves.length > 0 ? Math.round(statsEleves.reduce((acc, s) => acc + s.tauxPresence, 0) / statsEleves.length) : 0, totalPaiements: paiements.reduce((acc, p) => acc + p.montantTotal, 0), totalPaye: paiements.reduce((acc, p) => acc + p.montantPaye, 0) };

  if (loading) {
    return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}><div style={{ textAlign: "center" }}><div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>);
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 20V10M9 20V4M15 20V14M21 20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
          <div><h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Statistiques</h1><p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Vue d'ensemble</p></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}><p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>Eleves actifs</p><p style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>{globalStats.elevesActifs}</p></div>
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}><p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>Appels</p><p style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>{globalStats.totalPresences}</p></div>
        <div style={{ background: "#ecfdf5", borderRadius: 12, padding: 20, border: "1px solid #a7f3d0" }}><p style={{ fontSize: 13, color: "#059669", margin: "0 0 8px" }}>Taux presence</p><p style={{ fontSize: 28, fontWeight: 700, color: "#10b981", margin: 0 }}>{globalStats.tauxPresenceMoyen}%</p></div>
        <div style={{ background: "#fffbeb", borderRadius: 12, padding: 20, border: "1px solid #fde68a" }}><p style={{ fontSize: 13, color: "#d97706", margin: "0 0 8px" }}>Recouvrement</p><p style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b", margin: 0 }}>{globalStats.totalPaiements > 0 ? Math.round((globalStats.totalPaye / globalStats.totalPaiements) * 100) : 0}%</p></div>
      </div>

      <div style={{ marginBottom: 24 }}><select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} aria-label="Filtrer par classe" style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", minWidth: 200 }}><option value="">Toutes les classes</option>{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>

      {statsEleves.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center" }}><p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Aucun eleve</p></div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8fafc" }}><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Eleve</th><th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Classe</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Pres.</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Abs.</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Taux</th><th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Paiements</th></tr></thead>
            <tbody>
              {statsEleves.map((stats) => (
                <tr key={stats.eleve.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px 20px" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: stats.eleve.sexe === "M" ? "#dbeafe" : "#fce7f3", color: stats.eleve.sexe === "M" ? "#3b82f6" : "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>{stats.eleve.prenom[0]}{stats.eleve.nom[0]}</div><p style={{ margin: 0, fontWeight: 500, color: "#1e293b" }}>{stats.eleve.prenom} {stats.eleve.nom}</p></div></td>
                  <td style={{ padding: "16px 20px", color: "#64748b", fontSize: 14 }}>{stats.eleve.classe}</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><span style={{ color: "#10b981", fontWeight: 500 }}>{stats.presences}</span></td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><span style={{ color: "#ef4444", fontWeight: 500 }}>{stats.absences}</span></td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: stats.tauxPresence >= 80 ? "#ecfdf5" : stats.tauxPresence >= 60 ? "#fffbeb" : "#fef2f2", borderRadius: 20 }}><div style={{ width: 40, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${stats.tauxPresence}%`, height: "100%", background: stats.tauxPresence >= 80 ? "#10b981" : stats.tauxPresence >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} /></div><span style={{ fontSize: 12, fontWeight: 600, color: stats.tauxPresence >= 80 ? "#10b981" : stats.tauxPresence >= 60 ? "#f59e0b" : "#ef4444" }}>{stats.tauxPresence}%</span></div></td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><span style={{ padding: "4px 10px", background: stats.paiements.statut === "ok" ? "#ecfdf5" : stats.paiements.statut === "partiel" ? "#fffbeb" : "#fef2f2", color: stats.paiements.statut === "ok" ? "#10b981" : stats.paiements.statut === "partiel" ? "#f59e0b" : "#ef4444", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{stats.paiements.statut === "ok" ? "A jour" : stats.paiements.statut === "partiel" ? "Partiel" : "Impaye"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
