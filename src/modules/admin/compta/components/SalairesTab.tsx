import type { Salaire, CreateSalaireParams } from "../compta.types";
import type { Professeur } from "../../../professeurs/professeur.types";
import type { useTheme } from "../../../../context/ThemeContext";

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

export default function SalairesTab({
  salaires, profs, colors, showForm, setShowForm, form, setForm, onSubmit, onToggleStatut, submitting, mois,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Total: <strong style={{ color: colors.text }}>{formatMontant(totalSalaires)}</strong>
          {" — "}Paye: <strong style={{ color: colors.success }}>{formatMontant(totalPaye)}</strong>
        </span>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) setForm({ ...form, mois }); }} style={{ padding: "10px 20px", background: colors.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          {showForm ? "Annuler" : "+ Salaire"}
        </button>
      </div>

      {showForm && (
        <SalaireForm form={form} setForm={setForm} onSubmit={onSubmit} submitting={submitting} profs={profs} colors={colors} />
      )}

      {salaires.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun salaire pour ce mois</p>
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  {["Professeur", "Mois", "Montant", "Statut", "Date paiement", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: h === "Professeur" ? "left" : "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salaires.map((s) => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>{s.profNom}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: colors.textMuted, fontSize: 14 }}>{formatDate(s.mois)}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: colors.warning, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{formatMontant(s.montant)}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                        background: s.statut === "paye" ? colors.successBg : colors.dangerBg,
                        color: s.statut === "paye" ? colors.success : colors.danger,
                      }}>
                        {s.statut === "paye" ? "Paye" : "Non paye"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: colors.textMuted, fontSize: 14 }}>{s.datePaiement ? formatDate(s.datePaiement) : "-"}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button onClick={() => onToggleStatut(s)} style={{
                        padding: "6px 12px",
                        background: s.statut === "paye" ? colors.warningBg : colors.successBg,
                        border: `1px solid ${s.statut === "paye" ? colors.warning : colors.success}40`,
                        borderRadius: 6, fontSize: 12,
                        color: s.statut === "paye" ? colors.warning : colors.success,
                        cursor: "pointer",
                      }}>
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

function SalaireForm({
  form, setForm, onSubmit, submitting, profs, colors,
}: {
  form: CreateSalaireParams;
  setForm: (v: CreateSalaireParams) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  profs: Professeur[];
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
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Professeur</label>
          <select value={form.profId} onChange={(e) => setForm({ ...form, profId: e.target.value })} required style={inputStyle}>
            <option value="">Choisir un professeur</option>
            {profs.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Mois</label>
          <input type="month" value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })} required style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Montant</label>
          <input type="number" value={form.montant || ""} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} required min={1} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Statut</label>
          <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as "paye" | "non_paye" })} style={inputStyle}>
            <option value="non_paye">Non paye</option>
            <option value="paye">Paye</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={submitting} style={{ padding: "10px 24px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
        {submitting ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
