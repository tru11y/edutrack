import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { ALL_SOIR_CLASSES } from "./soir.constants";

interface SoirEleve {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
}

interface PresenceRecord {
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  statut: "present" | "absent" | "retard";
}

export default function SoirPresenceAppel() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const navigate = useNavigate();

  const [selectedClasse, setSelectedClasse] = useState(ALL_SOIR_CLASSES[0] || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [eleves, setEleves] = useState<SoirEleve[]>([]);
  const [presences, setPresences] = useState<Record<string, "present" | "absent" | "retard">>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadEleves = async () => {
    if (!selectedClasse) return;
    setLoading(true);
    try {
      const q = schoolId
        ? query(collection(db, "eleves"), where("schoolId", "==", schoolId), where("programme", "==", "soir"), where("classe", "==", selectedClasse))
        : query(collection(db, "eleves"), where("programme", "==", "soir"), where("classe", "==", selectedClasse));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SoirEleve));
      data.sort((a, b) => a.nom.localeCompare(b.nom));
      setEleves(data);
      const init: Record<string, "present" | "absent" | "retard"> = {};
      data.forEach((e) => { init[e.id] = "present"; });
      setPresences(init);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEleves(); }, [selectedClasse, schoolId]);

  const toggle = (id: string, val: "present" | "absent" | "retard") => {
    setPresences((p) => ({ ...p, [id]: val }));
  };

  const handleSave = async () => {
    if (eleves.length === 0) return;
    setSaving(true);
    try {
      const records: PresenceRecord[] = eleves.map((e) => ({
        eleveId: e.id,
        eleveNom: e.nom,
        elevePrenom: e.prenom,
        statut: presences[e.id] || "absent",
      }));

      await addDoc(collection(db, "presences"), {
        classe: selectedClasse,
        date,
        programme: "soir",
        schoolId: schoolId || null,
        presences: records,
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
        createdByName: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.email,
      });

      setSaved(true);
      setTimeout(() => navigate("/cours-du-soir/presences"), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const presents = Object.values(presences).filter((v) => v === "present").length;
  const absents = Object.values(presences).filter((v) => v === "absent").length;
  const retards = Object.values(presences).filter((v) => v === "retard").length;

  const buttonStyle = (variant: "present" | "absent" | "retard", current: string) => ({
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    background: current === variant
      ? variant === "present" ? colors.success : variant === "absent" ? colors.danger : colors.warning
      : colors.bgHover,
    color: current === variant ? "#fff" : colors.textMuted,
    transition: "all 0.15s",
  });

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginBottom: 24 }}>Appel — Cours du soir</h1>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 6 }}>Classe</label>
            <select
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text }}
            >
              {ALL_SOIR_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 6 }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement des élèves…</p>
      ) : eleves.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted, background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}` }}>
          <p>Aucun élève dans cette classe</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: `${colors.success}1a`, color: colors.success, fontWeight: 600 }}>✓ {presents} présent(s)</span>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: `${colors.danger}1a`, color: colors.danger, fontWeight: 600 }}>✗ {absents} absent(s)</span>
            {retards > 0 && <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: `${colors.warning}1a`, color: colors.warning, fontWeight: 600 }}>⏱ {retards} retard(s)</span>}
          </div>

          {/* Student list */}
          <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 20 }}>
            {eleves.map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i > 0 ? `1px solid ${colors.border}` : "none" }}>
                <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>
                  {e.prenom} {e.nom}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={buttonStyle("present", presences[e.id])} onClick={() => toggle(e.id, "present")}>Présent</button>
                  <button style={buttonStyle("retard", presences[e.id])} onClick={() => toggle(e.id, "retard")}>Retard</button>
                  <button style={buttonStyle("absent", presences[e.id])} onClick={() => toggle(e.id, "absent")}>Absent</button>
                </div>
              </div>
            ))}
          </div>

          {saved && (
            <div style={{ padding: "12px 16px", background: colors.successBg, border: `1px solid ${colors.success}40`, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ color: colors.success, margin: 0, fontWeight: 600 }}>✓ Appel enregistré avec succès !</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{ flex: 1, padding: 14, background: saved ? colors.success : saving ? colors.border : colors.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer l'appel"}
            </button>
            <button onClick={() => navigate("/cours-du-soir/presences")} style={{ padding: "14px 24px", background: colors.bgHover, color: colors.textMuted, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
}
