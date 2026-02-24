import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useTenant } from "../../context/TenantContext";

interface PresenceEntry {
  id: string;
  date: string;
  classe: string;
  presents: number;
  absents: number;
  total: number;
}

export default function SoirPresencesList() {
  const { colors } = useTheme();
  const { schoolId } = useTenant();
  const [entries, setEntries] = useState<PresenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const q = schoolId
          ? query(collection(db, "presences"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
          : query(collection(db, "presences"), where("programme", "==", "soir"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => {
          const p = d.data();
          const presencesArr: { statut: string }[] = Array.isArray(p.presences) ? p.presences : [];
          const presents = presencesArr.filter((x) => x.statut === "present").length;
          const absents = presencesArr.filter((x) => x.statut === "absent").length;
          return {
            id: d.id,
            date: p.date || "—",
            classe: p.classe || "—",
            presents,
            absents,
            total: presencesArr.length,
          };
        });
        setEntries(data.sort((a, b) => b.date.localeCompare(a.date)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId]);

  const classes = [...new Set(entries.map((e) => e.classe).filter(Boolean))].sort();
  const filtered = filterClasse ? entries.filter((e) => e.classe === filterClasse) : entries;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 4px" }}>Présences — Cours du soir</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{filtered.length} session(s)</p>
        </div>
        <Link to="/cours-du-soir/presences/appel" style={{ padding: "10px 20px", background: colors.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          Faire l'appel
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          style={{ padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>
          <p>Aucune session enregistrée</p>
          <Link to="/cours-du-soir/presences/appel" style={{ color: colors.primary }}>Faire le premier appel</Link>
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                {["Date", "Classe", "Présents", "Absents", "Total"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : "none" }}>
                  <td style={{ padding: "12px 16px", color: colors.text }}>{e.date}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, background: colors.primaryBg, color: colors.primary }}>{e.classe}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: colors.success, fontWeight: 600 }}>{e.presents}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: colors.danger, fontWeight: 600 }}>{e.absents}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: colors.textMuted }}>{e.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
