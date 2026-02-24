import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";

interface SoirPaiement {
  id: string;
  eleveNom: string;
  elevePrenom?: string;
  classe?: string;
  mois: string;
  montantTotal: number;
  montantPaye: number;
  statut: "paye" | "partiel" | "impaye";
  datePaiement?: Timestamp | Date | null;
}

function formatDate(val: unknown): string {
  if (!val) return "—";
  if (val instanceof Timestamp) return val.toDate().toLocaleDateString("fr-FR");
  if (val instanceof Date) return val.toLocaleDateString("fr-FR");
  return "—";
}

function fmt(n: number): string {
  return (n || 0).toLocaleString("fr-FR") + " FCFA";
}

const STATUT_COLORS: Record<string, string> = { paye: "#10b981", partiel: "#f59e0b", impaye: "#ef4444" };
const STATUT_LABELS: Record<string, string> = { paye: "Payé", partiel: "Partiel", impaye: "Impayé" };

export default function SoirPaiementsList() {
  const { colors } = useTheme();
  const { schoolId } = useTenant();
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<SoirPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const canManage = user?.role === "admin" || user?.role === "gestionnaire";

  const load = async () => {
    try {
      const q = schoolId
        ? query(collection(db, "paiements"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
        : query(collection(db, "paiements"), where("programme", "==", "soir"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SoirPaiement));
      setPaiements(data.sort((a, b) => b.mois.localeCompare(a.mois)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    await deleteDoc(doc(db, "paiements", id));
    setPaiements((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = paiements.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.eleveNom.toLowerCase().includes(q) || (p.elevePrenom || "").toLowerCase().includes(q);
    const matchStatut = !filterStatut || p.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const inputStyle = { padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 4px" }}>Paiements — Cours du soir</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{filtered.length} paiement(s)</p>
        </div>
        {canManage && (
          <Link to="/cours-du-soir/paiements/nouveau" style={{ padding: "10px 20px", background: colors.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            + Nouveau paiement
          </Link>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} placeholder="Rechercher un élève..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={inputStyle} value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="paye">Payé</option>
          <option value="partiel">Partiel</option>
          <option value="impaye">Impayé</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>
          <p>Aucun paiement trouvé</p>
          {canManage && <Link to="/cours-du-soir/paiements/nouveau" style={{ color: colors.primary }}>Enregistrer le premier paiement</Link>}
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                {["Élève", "Mois", "Total", "Payé", "Statut", "Date", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: colors.text }}>{p.elevePrenom} {p.eleveNom}</td>
                  <td style={{ padding: "12px 16px", color: colors.textMuted }}>{p.mois}</td>
                  <td style={{ padding: "12px 16px", color: colors.text }}>{fmt(p.montantTotal)}</td>
                  <td style={{ padding: "12px 16px", color: colors.success, fontWeight: 600 }}>{fmt(p.montantPaye)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${STATUT_COLORS[p.statut]}1a`, color: STATUT_COLORS[p.statut] }}>
                      {STATUT_LABELS[p.statut] || p.statut}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: colors.textMuted, fontSize: 12 }}>{formatDate(p.datePaiement)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {canManage && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link to={`/cours-du-soir/paiements/${p.id}/modifier`} style={{ padding: "4px 12px", background: colors.primaryBg, color: colors.primary, borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Modifier</Link>
                        <button onClick={() => handleDelete(p.id)} style={{ padding: "4px 12px", background: colors.dangerBg, color: colors.danger, borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}>Supprimer</button>
                      </div>
                    )}
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
