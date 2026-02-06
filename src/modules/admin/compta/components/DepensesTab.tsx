import type { Depense, CreateDepenseParams } from "../compta.types";
import type { useTheme } from "../../../../context/ThemeContext";

const CATEGORIES_DEPENSES = [
  "Fournitures", "Maintenance", "Electricite", "Eau",
  "Internet", "Transport", "Evenements", "Autre",
];

function formatMontant(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

function formatDate(d: string): string {
  if (!d) return "-";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

export default function DepensesTab({
  depenses, colors, showForm, setShowForm, form, setForm, onSubmit, onDelete, submitting,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Total: <strong style={{ color: colors.text }}>{formatMontant(totalDepenses)}</strong>
        </span>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: colors.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          {showForm ? "Annuler" : "+ Depense"}
        </button>
      </div>

      {showForm && (
        <DepenseForm form={form} setForm={setForm} onSubmit={onSubmit} submitting={submitting} colors={colors} />
      )}

      {depenses.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucune depense pour ce mois</p>
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  {["Date", "Libelle", "Categorie", "Montant", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: h === "Montant" || h === "" ? "right" : "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: 14 }}>{formatDate(d.date)}</td>
                    <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>{d.libelle}</td>
                    <td style={{ padding: "14px 20px", fontSize: 14 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, background: colors.infoBg, color: colors.info }}>{d.categorie}</span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: colors.danger, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{formatMontant(d.montant)}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button onClick={() => onDelete(d.id)} style={{ padding: "6px 12px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 6, fontSize: 12, color: colors.danger, cursor: "pointer" }}>
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

function DepenseForm({
  form, setForm, onSubmit, submitting, colors,
}: {
  form: CreateDepenseParams;
  setForm: (v: CreateDepenseParams) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box" as const,
  };

  return (
    <form onSubmit={onSubmit} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Libelle</label>
          <input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Categorie</label>
          <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} style={inputStyle}>
            {CATEGORIES_DEPENSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Montant</label>
          <input type="number" value={form.montant || ""} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} required min={1} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={inputStyle} />
        </div>
      </div>
      <button type="submit" disabled={submitting} style={{ padding: "10px 24px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
        {submitting ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
