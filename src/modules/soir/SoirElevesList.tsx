import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";

interface SoirEleve {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  telephone?: string;
  dateNaissance?: string;
}

export default function SoirElevesList() {
  const { colors } = useTheme();
  const { schoolId } = useTenant();
  const { user } = useAuth();
  const [eleves, setEleves] = useState<SoirEleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const canManage = user?.role === "admin" || user?.role === "gestionnaire";

  const load = async () => {
    try {
      const q = schoolId
        ? query(collection(db, "eleves"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
        : query(collection(db, "eleves"), where("programme", "==", "soir"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SoirEleve));
      setEleves(data.sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet élève ?")) return;
    await deleteDoc(doc(db, "eleves", id));
    setEleves((prev) => prev.filter((e) => e.id !== id));
  };

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))].sort();

  const filtered = eleves.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || (e.telephone || "").includes(q);
    const matchClasse = !filterClasse || e.classe === filterClasse;
    return matchSearch && matchClasse;
  });

  const inputStyle = {
    padding: "10px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    background: colors.bgInput,
    color: colors.text,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 4px" }}>Élèves — Cours du soir</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{filtered.length} élève(s)</p>
        </div>
        {canManage && (
          <Link to="/cours-du-soir/eleves/nouveau" style={{ padding: "10px 20px", background: colors.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            + Ajouter
          </Link>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={inputStyle} value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>
          <p>Aucun élève trouvé</p>
          {canManage && <Link to="/cours-du-soir/eleves/nouveau" style={{ color: colors.primary }}>Ajouter le premier élève</Link>}
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                {["Nom", "Prénom", "Classe", "Téléphone", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: colors.text }}>{e.nom}</td>
                  <td style={{ padding: "12px 16px", color: colors.text }}>{e.prenom}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, background: colors.primaryBg, color: colors.primary, fontWeight: 500 }}>{e.classe}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: colors.textMuted, fontSize: 13 }}>{e.telephone || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canManage && (
                        <>
                          <Link to={`/cours-du-soir/eleves/${e.id}/modifier`} style={{ padding: "4px 12px", background: colors.primaryBg, color: colors.primary, borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Modifier</Link>
                          <button onClick={() => handleDelete(e.id)} style={{ padding: "4px 12px", background: colors.dangerBg, color: colors.danger, borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}>Supprimer</button>
                        </>
                      )}
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
