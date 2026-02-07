import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  getComptaStatsSecure,
  getDepensesSecure,
  getSalairesSecure,
  createDepenseSecure,
  deleteDepenseSecure,
  createSalaireSecure,
  updateSalaireStatutSecure,
} from "./compta.service";
import { getAllPaiements } from "../../paiements/paiement.service";
import { getAllProfesseurs } from "../../professeurs/professeur.service";
import type { ComptaStats, Depense, Salaire, CreateDepenseParams, CreateSalaireParams } from "./compta.types";
import type { Paiement } from "../../paiements/paiement.types";
import type { Professeur } from "../../professeurs/professeur.types";
import PaiementsTab from "./components/PaiementsTab";
import DepensesTab from "./components/DepensesTab";
import SalairesTab from "./components/SalairesTab";

type Tab = "paiements" | "depenses" | "salaires";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMontant(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

export default function AdminComptaDashboard() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("paiements");
  const [mois, setMois] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<ComptaStats | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [profs, setProfs] = useState<Professeur[]>([]);

  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [showSalaireForm, setShowSalaireForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [depenseForm, setDepenseForm] = useState<CreateDepenseParams>({
    libelle: "", categorie: "Fournitures", montant: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const [salaireForm, setSalaireForm] = useState<CreateSalaireParams>({
    profId: "", mois: getCurrentMonth(), montant: 0, statut: "non_paye",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [paiementsRes, profsRes, statsRes, depensesRes, salairesRes] = await Promise.allSettled([
      getAllPaiements(),
      getAllProfesseurs(),
      getComptaStatsSecure(mois),
      getDepensesSecure(mois),
      getSalairesSecure(mois),
    ]);

    const errors: string[] = [];

    if (paiementsRes.status === "fulfilled") {
      setPaiements(paiementsRes.value.filter((p) => p.mois === mois));
    } else {
      console.error("getAllPaiements failed:", paiementsRes.reason);
      errors.push("paiements");
    }

    if (profsRes.status === "fulfilled") {
      setProfs(profsRes.value);
    } else {
      console.error("getAllProfesseurs failed:", profsRes.reason);
      errors.push("professeurs");
    }

    if (statsRes.status === "fulfilled") {
      setStats(statsRes.value.stats);
    } else {
      console.error("getComptaStats failed:", statsRes.reason);
      errors.push("stats");
    }

    if (depensesRes.status === "fulfilled") {
      setDepenses(depensesRes.value.depenses);
    } else {
      console.error("getDepenses failed:", depensesRes.reason);
      errors.push("depenses");
    }

    if (salairesRes.status === "fulfilled") {
      setSalaires(salairesRes.value.salaires);
    } else {
      console.error("getSalaires failed:", salairesRes.reason);
      errors.push("salaires");
    }

    if (errors.length > 0) {
      setError(`Erreur sur: ${errors.join(", ")}. Verifiez que les Cloud Functions sont deployees.`);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [mois]);

  const handleCreateDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depenseForm.libelle || !depenseForm.montant) return;
    setSubmitting(true);
    try {
      await createDepenseSecure(depenseForm);
      setShowDepenseForm(false);
      setDepenseForm({ libelle: "", categorie: "Fournitures", montant: 0, date: new Date().toISOString().split("T")[0] });
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la creation de la depense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepense = async (id: string) => {
    if (!confirm("Supprimer cette depense ?")) return;
    try { await deleteDepenseSecure(id); await loadData(); } catch (err) { console.error(err); }
  };

  const handleCreateSalaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaireForm.profId || !salaireForm.montant) return;
    setSubmitting(true);
    try {
      const params: CreateSalaireParams = { ...salaireForm };
      if (salaireForm.statut === "paye") params.datePaiement = new Date().toISOString().split("T")[0];
      await createSalaireSecure(params);
      setShowSalaireForm(false);
      setSalaireForm({ profId: "", mois: getCurrentMonth(), montant: 0, statut: "non_paye" });
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la creation du salaire.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSalaireStatut = async (salaire: Salaire) => {
    const newStatut = salaire.statut === "paye" ? "non_paye" : "paye";
    const datePaiement = newStatut === "paye" ? new Date().toISOString().split("T")[0] : undefined;
    try { await updateSalaireStatutSecure(salaire.id, newStatut, datePaiement); await loadData(); } catch (err) { console.error(err); }
  };

  if (loading) {
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "paiements", label: "Paiements" },
    { key: "depenses", label: "Depenses" },
    { key: "salaires", label: "Salaires" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7Z" stroke="currentColor" strokeWidth="2"/><path d="M2 10H22" stroke="currentColor" strokeWidth="2"/><path d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Comptabilite</h1>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Gestion financiere de l'ecole</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text }} />
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
        </div>
      )}

      {stats && <StatsCards stats={stats} colors={colors} />}

      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: colors.bgSecondary, borderRadius: 12, padding: 4 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "12px 16px",
            background: tab === t.key ? colors.bgCard : "transparent",
            border: tab === t.key ? `1px solid ${colors.border}` : "1px solid transparent",
            borderRadius: 10, fontSize: 14, fontWeight: 500,
            color: tab === t.key ? colors.text : colors.textMuted,
            cursor: "pointer", boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "paiements" && <PaiementsTab paiements={paiements} colors={colors} />}
      {tab === "depenses" && <DepensesTab depenses={depenses} colors={colors} showForm={showDepenseForm} setShowForm={setShowDepenseForm} form={depenseForm} setForm={setDepenseForm} onSubmit={handleCreateDepense} onDelete={handleDeleteDepense} submitting={submitting} />}
      {tab === "salaires" && <SalairesTab salaires={salaires} profs={profs} colors={colors} showForm={showSalaireForm} setShowForm={setShowSalaireForm} form={salaireForm} setForm={setSalaireForm} onSubmit={handleCreateSalaire} onToggleStatut={handleToggleSalaireStatut} submitting={submitting} mois={mois} />}
    </div>
  );
}

function StatsCards({ stats, colors }: { stats: ComptaStats; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Paiements recus</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0, fontVariantNumeric: "tabular-nums" }}>{formatMontant(stats.totalPaiementsRecus)}</p>
      </div>
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Depenses</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: colors.danger, margin: 0, fontVariantNumeric: "tabular-nums" }}>{formatMontant(stats.totalDepenses)}</p>
      </div>
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Salaires</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: colors.warning, margin: 0, fontVariantNumeric: "tabular-nums" }}>{formatMontant(stats.totalSalaires)}</p>
      </div>
      <div style={{
        background: stats.resultatNet >= 0 ? colors.successBg : colors.dangerBg, borderRadius: 12, padding: 20,
        border: `1px solid ${stats.resultatNet >= 0 ? colors.success : colors.danger}40`,
      }}>
        <p style={{ fontSize: 13, color: stats.resultatNet >= 0 ? colors.success : colors.danger, margin: "0 0 8px" }}>Resultat net</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: stats.resultatNet >= 0 ? colors.success : colors.danger, margin: 0, fontVariantNumeric: "tabular-nums" }}>{formatMontant(stats.resultatNet)}</p>
      </div>
    </div>
  );
}
