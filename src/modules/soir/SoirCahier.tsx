import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";

interface CahierEntry {
  id: string;
  classe: string;
  matiere: string;
  contenu: string;
  date: string;
  profNom?: string;
  createdAt?: Timestamp;
}

export default function SoirCahier() {
  const { colors } = useTheme();
  const { schoolId } = useTenant();
  const { user } = useAuth();
  const [entries, setEntries] = useState<CahierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const canManage = user?.role === "admin" || user?.role === "gestionnaire" || user?.role === "prof";

  const load = async () => {
    try {
      const q = schoolId
        ? query(collection(db, "cahier"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
        : query(collection(db, "cahier"), where("programme", "==", "soir"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CahierEntry));
      setEntries(data.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await deleteDoc(doc(db, "cahier", id));
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const classes = [...new Set(entries.map((e) => e.classe).filter(Boolean))].sort();
  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.matiere.toLowerCase().includes(q) || e.contenu.toLowerCase().includes(q) || (e.profNom || "").toLowerCase().includes(q);
    const matchClasse = !filterClasse || e.classe === filterClasse;
    return matchSearch && matchClasse;
  });

  const inputStyle = { padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 4px" }}>Cahier de texte — Cours du soir</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{filtered.length} entrée(s)</p>
        </div>
        {canManage && (
          <Link to="/cours-du-soir/cahier/nouveau" style={{ padding: "10px 20px", background: colors.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            + Ajouter une entrée
          </Link>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={inputStyle} value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>
          <p>Aucune entrée</p>
          {canManage && <Link to="/cours-du-soir/cahier/nouveau" style={{ color: colors.primary }}>Ajouter la première entrée</Link>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((e) => (
            <div key={e.id} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, background: colors.primaryBg, color: colors.primary, fontWeight: 500 }}>{e.classe}</span>
                  <span style={{ fontWeight: 700, color: colors.text, fontSize: 14 }}>{e.matiere}</span>
                  <span style={{ color: colors.textMuted, fontSize: 12 }}>{e.date}</span>
                  {e.profNom && <span style={{ color: colors.textMuted, fontSize: 12 }}>· {e.profNom}</span>}
                </div>
                {canManage && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/cours-du-soir/cahier/${e.id}/modifier`} style={{ padding: "4px 12px", background: colors.primaryBg, color: colors.primary, borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Modifier</Link>
                    <button onClick={() => handleDelete(e.id)} style={{ padding: "4px 12px", background: colors.dangerBg, color: colors.danger, borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}>Supprimer</button>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.contenu}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
