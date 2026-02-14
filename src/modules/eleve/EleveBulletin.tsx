import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getBulletinsByEleve } from "../notes/notes.service";
import BulletinView from "../notes/BulletinView";
import type { Bulletin } from "../notes/notes.types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function EleveBulletin() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [eleveNom, setEleveNom] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.eleveId) loadData();
  }, [user]);

  async function loadData() {
    try {
      const eleveDoc = await getDoc(doc(db, "eleves", user!.eleveId!));
      if (eleveDoc.exists()) {
        const d = eleveDoc.data();
        setEleveNom(`${d.prenom} ${d.nom}`);
      }
      const results = await getBulletinsByEleve(user!.eleveId!);
      setBulletins(results.sort((a, b) => a.trimestre - b.trimestre));
    } catch {
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 24 }}>Mes bulletins</h1>
      {bulletins.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMuted }}>
          Aucun bulletin disponible.
        </div>
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
