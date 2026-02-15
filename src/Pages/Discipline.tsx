import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast, ConfirmModal } from "../components/ui";
import {
  getDisciplineRecordsSecure,
  createDisciplineRecordSecure,
  deleteDisciplineRecordSecure,
  getCloudFunctionErrorMessage,
  type DisciplineRecordResult,
} from "../services/cloudFunctions";
import { getAllEleves } from "../modules/eleves/eleve.service";
import type { Eleve } from "../modules/eleves/eleve.types";
import { exportDisciplinePDF } from "../modules/discipline/discipline.pdf";
import { ClassSelect } from "../components/ui/Select";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  exclusion: { label: "Exclusion", color: "#ef4444" },
  retard_grave: { label: "Retard grave", color: "#f59e0b" },
  impaye: { label: "Impaye", color: "#f97316" },
  absence: { label: "Absence", color: "#8b5cf6" },
  indiscipline: { label: "Indiscipline", color: "#ec4899" },
  fraude: { label: "Fraude", color: "#dc2626" },
  autre: { label: "Autre", color: "#6b7280" },
};

export default function Discipline() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";

  const [records, setRecords] = useState<DisciplineRecordResult[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  // Form state
  const [formEleveId, setFormEleveId] = useState("");
  const [formType, setFormType] = useState("indiscipline");
  const [formDescription, setFormDescription] = useState("");
  const [formMotif, setFormMotif] = useState("");
  const [formSanction, setFormSanction] = useState("");

  const loadData = async () => {
    try {
      const [discRes, elevesData] = await Promise.all([
        getDisciplineRecordsSecure({ classe: filterClasse || undefined, type: filterType || undefined }),
        getAllEleves(),
      ]);
      setRecords(discRes.records);
      setEleves(elevesData.filter((e) => e.statut === "actif"));
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterClasse, filterType]);

  const handleSubmit = async () => {
    if (!formEleveId || !formDescription) {
      toast.error("Selectionnez un eleve et remplissez la description.");
      return;
    }
    const eleve = eleves.find((e) => e.id === formEleveId);
    if (!eleve) return;

    setSaving(true);
    try {
      await createDisciplineRecordSecure({
        eleveId: formEleveId,
        eleveNom: eleve.nom,
        elevePrenom: eleve.prenom,
        classe: eleve.classe,
        type: formType,
        description: formDescription,
        motif: formMotif,
        sanction: formSanction,
      });
      toast.success("Incident enregistre.");
      setShowForm(false);
      setFormEleveId("");
      setFormDescription("");
      setFormMotif("");
      setFormSanction("");
      await loadData();
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Supprimer l'incident",
      message: "Voulez-vous vraiment supprimer cet incident disciplinaire ?",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteDisciplineRecordSecure(id);
          toast.success("Incident supprime.");
          setConfirmState((p) => ({ ...p, isOpen: false }));
          await loadData();
        } catch (err) {
          toast.error(getCloudFunctionErrorMessage(err));
        }
      },
    });
  };

  const handleExportPDF = () => {
    const mapped = records.map((r) => ({
      ...r,
      createdAt: r.createdAt ? { toDate: () => new Date(r.createdAt!) } : undefined,
    }));
    exportDisciplinePDF(mapped as never);
  };

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))].sort();

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    outline: "none",
  };

  const btnPrimary = {
    padding: "10px 20px",
    background: colors.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: "pointer",
  };

  if (loading) return <div style={{ padding: 32, color: colors.text }}>Chargement...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Registre disciplinaire</h1>
          <p style={{ color: colors.textMuted, margin: "4px 0 0", fontSize: 14 }}>{records.length} incident{records.length > 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExportPDF} style={{ ...btnPrimary, background: colors.bgCard, color: colors.text, border: `1px solid ${colors.border}` }}>
            Export PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
            {showForm ? "Fermer" : "+ Nouvel incident"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <ClassSelect value={filterClasse} onChange={setFilterClasse} allLabel="Toutes les classes" classes={classes} colors={colors} />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 160 }}
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: colors.text, margin: "0 0 16px", fontSize: 16 }}>Nouvel incident</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Eleve *</label>
              <select value={formEleveId} onChange={(e) => setFormEleveId(e.target.value)} style={inputStyle}>
                <option value="">Selectionnez un eleve</option>
                {eleves.map((e) => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.classe})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Type *</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} style={inputStyle}>
                {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Description *</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }}
                placeholder="Decrivez l'incident..."
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Motif</label>
              <input value={formMotif} onChange={(e) => setFormMotif(e.target.value)} style={inputStyle} placeholder="Motif (optionnel)" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Sanction</label>
              <input value={formSanction} onChange={(e) => setFormSanction(e.target.value)} style={inputStyle} placeholder="Sanction (optionnel)" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={{ ...btnPrimary, background: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}` }}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: colors.bgSecondary }}>
            <tr>
              {["Date", "Eleve", "Classe", "Type", "Description", "Sanction", "Source", ""].map((h) => (
                <th key={h} style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: colors.textMuted }}>Aucun incident enregistre.</td></tr>
            )}
            {records.map((r, idx) => {
              const typeInfo = TYPE_LABELS[r.type] || { label: r.type, color: "#6b7280" };
              return (
                <tr key={r.id} style={{ borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13, fontWeight: 500 }}>
                    {r.elevePrenom} {r.eleveNom}
                  </td>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13 }}>{r.classe}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${typeInfo.color}18`,
                      color: typeInfo.color,
                    }}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.description}
                  </td>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13 }}>{r.sanction || "-"}</td>
                  <td style={{ padding: 12, color: colors.textMuted, fontSize: 12 }}>
                    {r.isSystem ? "Systeme" : r.profNom || "Prof"}
                  </td>
                  <td style={{ padding: 12 }}>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
      />
    </div>
  );
}
