import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getBulletinsByEleve } from "../notes/notes.service";
import BulletinView from "../notes/BulletinView";
import type { Bulletin } from "../notes/notes.types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function ParentBulletins() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const enfantsIds = user?.enfantsIds || [];
  const [selectedEnfant, setSelectedEnfant] = useState(enfantsIds[0] || "");
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [eleveNom, setEleveNom] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedEnfant) loadData();
  }, [selectedEnfant]);

  async function loadData() {
    setLoading(true);
    try {
      const eleveDoc = await getDoc(doc(db, "eleves", selectedEnfant));
      if (eleveDoc.exists()) {
        const d = eleveDoc.data();
        setEleveNom(`${d.prenom} ${d.nom}`);
      }
      const results = await getBulletinsByEleve(selectedEnfant);
      setBulletins(results.sort((a, b) => a.trimestre - b.trimestre));
    } catch {
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  }

  if (enfantsIds.length === 0) {
    return <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Aucun enfant associe.</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Bulletins</h1>
        {enfantsIds.length > 1 && (
          <select
            value={selectedEnfant}
            onChange={(e) => setSelectedEnfant(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
              background: colors.bgCard, color: colors.text, fontSize: 13,
            }}
          >
            {enfantsIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>
      ) : bulletins.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMuted }}>Aucun bulletin disponible.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bulletins.map((b) => (
            <BulletinView key={b.id || `${b.trimestre}`} bulletin={b} eleveNom={eleveNom} />
          ))}
        </div>
      )}
    </div>
  );
}
