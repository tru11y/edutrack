import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

interface Creneau {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  professeurNom: string;
  salle?: string;
}

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export default function ParentEmploiDuTemps() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const enfantsIds = user?.enfantsIds || [];
  const [selectedEnfant, setSelectedEnfant] = useState(enfantsIds[0] || "");
  const [classe, setClasse] = useState("");
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedEnfant) loadData();
  }, [selectedEnfant]);

  async function loadData() {
    setLoading(true);
    try {
      const eleveDoc = await getDoc(doc(db, "eleves", selectedEnfant));
      if (!eleveDoc.exists()) return;
      const eleveClasse = eleveDoc.data().classe;
      setClasse(eleveClasse);

      const snap = await getDocs(
        query(collection(db, "emploi_du_temps"), where("classe", "==", eleveClasse))
      );
      setCreneaux(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Creneau)));
    } catch {
      setCreneaux([]);
    } finally {
      setLoading(false);
    }
  }

  if (enfantsIds.length === 0) {
    return <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Aucun enfant associe.</div>;
  }

  const creneauxByJour = JOURS.reduce((acc, jour) => {
    acc[jour] = creneaux.filter((c) => c.jour === jour).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    return acc;
  }, {} as Record<string, Creneau[]>);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
          Emploi du temps {classe && `- ${classe}`}
        </h1>
        {enfantsIds.length > 1 && (
          <select
            value={selectedEnfant}
            onChange={(e) => setSelectedEnfant(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13 }}
          >
            {enfantsIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {JOURS.map((jour) => (
            <div key={jour} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: colors.primaryBg, borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.primary, textTransform: "capitalize" }}>{jour}</span>
              </div>
              {creneauxByJour[jour].length === 0 ? (
                <div style={{ padding: 16, color: colors.textMuted, fontSize: 12 }}>Pas de cours</div>
              ) : (
                creneauxByJour[jour].map((c) => (
                  <div key={c.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{c.matiere}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{c.heureDebut} - {c.heureFin}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{c.professeurNom}</div>
                    {c.salle && <div style={{ fontSize: 11, color: colors.textMuted }}>Salle {c.salle}</div>}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
