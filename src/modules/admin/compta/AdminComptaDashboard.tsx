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

type Tab = "paiements" | "depenses" | "salaires";

const CATEGORIES_DEPENSES = [
  "Fournitures",
  "Maintenance",
  "Electricite",
  "Eau",
  "Internet",
  "Transport",
  "Evenements",
  "Autre",
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMontant(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

function formatDate(d: string): string {
  if (!d) return "-";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
  return d;
}

export default function AdminComptaDashboard() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("paiements");
  const [mois, setMois] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [stats, setStats] = useState<ComptaStats | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [profs, setProfs] = useState<Professeur[]>([]);

  // Forms
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [showSalaireForm, setShowSalaireForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [depenseForm, setDepenseForm] = useState<CreateDepenseParams>({
    libelle: "",
    categorie: "Fournitures",
    montant: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const [salaireForm, setSalaireForm] = useState<CreateSalaireParams>({
    profId: "",
    mois: getCurrentMonth(),
    montant: 0,
    statut: "non_paye",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, depensesRes, salairesRes, paiementsData, profsData] =
        await Promise.all([
          getComptaStatsSecure(mois),
          getDepensesSecure(mois),
          getSalairesSecure(mois),
          getAllPaiements(),
          getAllProfesseurs(),
        ]);

      setStats(statsRes.stats);
      setDepenses(depensesRes.depenses);
      setSalaires(salairesRes.salaires);
      setPaiements(paiementsData.filter((p) => p.mois === mois));
      setProfs(profsData);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des donnees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mois]);

  const handleCreateDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depenseForm.libelle || !depenseForm.montant) return;
    setSubmitting(true);
    try {
      await createDepenseSecure(depenseForm);
      setShowDepenseForm(false);
      setDepenseForm({
        libelle: "",
        categorie: "Fournitures",
        montant: 0,
        date: new Date().toISOString().split("T")[0],
      });
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
    try {
      await deleteDepenseSecure(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSalaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaireForm.profId || !salaireForm.montant) return;
    setSubmitting(true);
    try {
      const params: CreateSalaireParams = {
        ...salaireForm,
      };
      if (salaireForm.statut === "paye") {
        params.datePaiement = new Date().toISOString().split("T")[0];
      }
      await createSalaireSecure(params);
      setShowSalaireForm(false);
      setSalaireForm({
        profId: "",
        mois: getCurrentMonth(),
        montant: 0,
        statut: "non_paye",
      });
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
    try {
      await updateSalaireStatutSecure(salaire.id, newStatut, datePaiement);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Spinner
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40,
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.primary,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
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
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: colors.primaryBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.primary,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Comptabilite</h1>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Gestion financiere de l'ecole</p>
          </div>
        </div>
      </div>

      {/* Month filter */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="month"
          value={mois}
          onChange={(e) => setMois(e.target.value)}
          style={{
            padding: "12px 16px",
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            fontSize: 14,
            background: colors.bgInput,
            color: colors.text,
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", background: colors.dangerBg,
          border: `1px solid ${colors.danger}40`,
          borderRadius: 10, marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16, marginBottom: 32,
        }}>
          <div style={{
            background: colors.bgCard, borderRadius: 12, padding: 20,
            border: `1px solid ${colors.border}`,
          }}>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Paiements recus</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatMontant(stats.totalPaiementsRecus)}
            </p>
          </div>
          <div style={{
            background: colors.bgCard, borderRadius: 12, padding: 20,
            border: `1px solid ${colors.border}`,
          }}>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Depenses</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.danger, margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatMontant(stats.totalDepenses)}
            </p>
          </div>
          <div style={{
            background: colors.bgCard, borderRadius: 12, padding: 20,
            border: `1px solid ${colors.border}`,
          }}>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Salaires</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.warning, margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatMontant(stats.totalSalaires)}
            </p>
          </div>
          <div style={{
            background: stats.resultatNet >= 0 ? colors.successBg : colors.dangerBg,
            borderRadius: 12, padding: 20,
            border: `1px solid ${stats.resultatNet >= 0 ? colors.success : colors.danger}40`,
          }}>
            <p style={{ fontSize: 13, color: stats.resultatNet >= 0 ? colors.success : colors.danger, margin: "0 0 8px" }}>Resultat net</p>
            <p style={{
              fontSize: 24, fontWeight: 700,
              color: stats.resultatNet >= 0 ? colors.success : colors.danger,
              margin: 0, fontVariantNumeric: "tabular-nums",
            }}>
              {formatMontant(stats.resultatNet)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        background: colors.bgSecondary, borderRadius: 12, padding: 4,
      }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: "12px 16px",
              background: tab === t.key ? colors.bgCard : "transparent",
              border: tab === t.key ? `1px solid ${colors.border}` : "1px solid transparent",
              borderRadius: 10, fontSize: 14, fontWeight: 500,
              color: tab === t.key ? colors.text : colors.textMuted,
              cursor: "pointer",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "paiements" && (
        <PaiementsTab paiements={paiements} colors={colors} />
      )}

      {tab === "depenses" && (
        <DepensesTab
          depenses={depenses}
          colors={colors}
          showForm={showDepenseForm}
          setShowForm={setShowDepenseForm}
          form={depenseForm}
          setForm={setDepenseForm}
          onSubmit={handleCreateDepense}
          onDelete={handleDeleteDepense}
          submitting={submitting}
        />
      )}

      {tab === "salaires" && (
        <SalairesTab
          salaires={salaires}
          profs={profs}
          colors={colors}
          showForm={showSalaireForm}
          setShowForm={setShowSalaireForm}
          form={salaireForm}
          setForm={setSalaireForm}
          onSubmit={handleCreateSalaire}
          onToggleStatut={handleToggleSalaireStatut}
          submitting={submitting}
          mois={mois}
        />
      )}
    </div>
  );
}

// ==================== PAIEMENTS TAB ====================

function PaiementsTab({
  paiements,
  colors,
}: {
  paiements: Paiement[];
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (paiements.length === 0) {
    return (
      <div style={{
        background: colors.bgCard, borderRadius: 16,
        border: `1px solid ${colors.border}`, padding: 60, textAlign: "center",
      }}>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun paiement pour ce mois</p>
      </div>
    );
  }

  const totalPaye = paiements.reduce((s, p) => s + (p.montantPaye || 0), 0);
  const totalAttendu = paiements.reduce((s, p) => s + (p.montantTotal || 0), 0);

  return (
    <div style={{
      background: colors.bgCard, borderRadius: 16,
      border: `1px solid ${colors.border}`, overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${colors.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
          {paiements.length} paiement{paiements.length > 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          {formatMontant(totalPaye)} / {formatMontant(totalAttendu)}
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: colors.bgSecondary }}>
              {["Eleve", "Mois", "Total", "Paye", "Restant", "Statut"].map((h) => (
                <th key={h} style={{
                  padding: "12px 20px", textAlign: h === "Eleve" ? "left" : "right",
                  fontSize: 12, fontWeight: 600, color: colors.textMuted,
                  textTransform: "uppercase",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>
                  {p.eleveNom}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", color: colors.textMuted, fontSize: 14 }}>
                  {formatDate(p.mois)}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 500, color: colors.text, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  {formatMontant(p.montantTotal)}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 500, color: colors.success, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  {formatMontant(p.montantPaye)}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 500, color: p.montantRestant > 0 ? colors.danger : colors.textMuted, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  {formatMontant(p.montantRestant)}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg,
                    color: p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger,
                  }}>
                    {p.statut === "paye" ? "Paye" : p.statut === "partiel" ? "Partiel" : "Impaye"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== DEPENSES TAB ====================

function DepensesTab({
  depenses,
  colors,
  showForm,
  setShowForm,
  form,
  setForm,
  onSubmit,
  onDelete,
  submitting,
}: {
  depenses: Depense[];
  colors: ReturnType<typeof useTheme>["colors"];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  form: CreateDepenseParams;
  setForm: (v: CreateDepenseParams) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  submitting: boolean;
}) {
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);

  return (
    <div>
      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Total: <strong style={{ color: colors.text }}>{formatMontant(totalDepenses)}</strong>
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            background: colors.primary,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {showForm ? "Annuler" : "+ Depense"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={onSubmit} style={{
          background: colors.bgCard, borderRadius: 12,
          border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Libelle</label>
              <input
                type="text"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                required
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Categorie</label>
              <select
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              >
                {CATEGORIES_DEPENSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Montant</label>
              <input
                type="number"
                value={form.montant || ""}
                onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                required
                min={1}
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 24px", background: colors.primary, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      {/* Table */}
      {depenses.length === 0 ? (
        <div style={{
          background: colors.bgCard, borderRadius: 16,
          border: `1px solid ${colors.border}`, padding: 60, textAlign: "center",
        }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucune depense pour ce mois</p>
        </div>
      ) : (
        <div style={{
          background: colors.bgCard, borderRadius: 16,
          border: `1px solid ${colors.border}`, overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  {["Date", "Libelle", "Categorie", "Montant", ""].map((h) => (
                    <th key={h} style={{
                      padding: "12px 20px",
                      textAlign: h === "Montant" || h === "" ? "right" : "left",
                      fontSize: 12, fontWeight: 600, color: colors.textMuted,
                      textTransform: "uppercase",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: 14 }}>
                      {formatDate(d.date)}
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>
                      {d.libelle}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14 }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 12,
                        background: colors.infoBg, color: colors.info,
                      }}>
                        {d.categorie}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: colors.danger, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                      {formatMontant(d.montant)}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => onDelete(d.id)}
                        style={{
                          padding: "6px 12px", background: colors.dangerBg,
                          border: `1px solid ${colors.danger}40`,
                          borderRadius: 6, fontSize: 12, color: colors.danger,
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SALAIRES TAB ====================

function SalairesTab({
  salaires,
  profs,
  colors,
  showForm,
  setShowForm,
  form,
  setForm,
  onSubmit,
  onToggleStatut,
  submitting,
  mois,
}: {
  salaires: Salaire[];
  profs: Professeur[];
  colors: ReturnType<typeof useTheme>["colors"];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  form: CreateSalaireParams;
  setForm: (v: CreateSalaireParams) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleStatut: (s: Salaire) => void;
  submitting: boolean;
  mois: string;
}) {
  const totalSalaires = salaires.reduce((s, d) => s + d.montant, 0);
  const totalPaye = salaires.filter((s) => s.statut === "paye").reduce((acc, s) => acc + s.montant, 0);

  return (
    <div>
      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Total: <strong style={{ color: colors.text }}>{formatMontant(totalSalaires)}</strong>
          {" — "}Paye: <strong style={{ color: colors.success }}>{formatMontant(totalPaye)}</strong>
        </span>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) setForm({ ...form, mois });
          }}
          style={{
            padding: "10px 20px",
            background: colors.primary,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {showForm ? "Annuler" : "+ Salaire"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={onSubmit} style={{
          background: colors.bgCard, borderRadius: 12,
          border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Professeur</label>
              <select
                value={form.profId}
                onChange={(e) => setForm({ ...form, profId: e.target.value })}
                required
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              >
                <option value="">Choisir un professeur</option>
                {profs.map((p) => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Mois</label>
              <input
                type="month"
                value={form.mois}
                onChange={(e) => setForm({ ...form, mois: e.target.value })}
                required
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Montant</label>
              <input
                type="number"
                value={form.montant || ""}
                onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                required
                min={1}
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as "paye" | "non_paye" })}
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
                  borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box",
                }}
              >
                <option value="non_paye">Non paye</option>
                <option value="paye">Paye</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 24px", background: colors.primary, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      {/* Table */}
      {salaires.length === 0 ? (
        <div style={{
          background: colors.bgCard, borderRadius: 16,
          border: `1px solid ${colors.border}`, padding: 60, textAlign: "center",
        }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun salaire pour ce mois</p>
        </div>
      ) : (
        <div style={{
          background: colors.bgCard, borderRadius: 16,
          border: `1px solid ${colors.border}`, overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  {["Professeur", "Mois", "Montant", "Statut", "Date paiement", ""].map((h) => (
                    <th key={h} style={{
                      padding: "12px 20px",
                      textAlign: h === "Montant" || h === "Statut" || h === "Date paiement" || h === "" ? "right" : "left",
                      fontSize: 12, fontWeight: 600, color: colors.textMuted,
                      textTransform: "uppercase",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salaires.map((s) => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>
                      {s.profNom}
                    </td>
                    <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: 14 }}>
                      {formatDate(s.mois)}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: colors.warning, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                      {formatMontant(s.montant)}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                        background: s.statut === "paye" ? colors.successBg : colors.dangerBg,
                        color: s.statut === "paye" ? colors.success : colors.danger,
                      }}>
                        {s.statut === "paye" ? "Paye" : "Non paye"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: colors.textMuted, fontSize: 14 }}>
                      {s.datePaiement ? formatDate(s.datePaiement) : "-"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => onToggleStatut(s)}
                        style={{
                          padding: "6px 12px",
                          background: s.statut === "paye" ? colors.warningBg : colors.successBg,
                          border: `1px solid ${s.statut === "paye" ? colors.warning : colors.success}40`,
                          borderRadius: 6, fontSize: 12,
                          color: s.statut === "paye" ? colors.warning : colors.success,
                          cursor: "pointer",
                        }}
                      >
                        {s.statut === "paye" ? "Annuler" : "Marquer paye"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
