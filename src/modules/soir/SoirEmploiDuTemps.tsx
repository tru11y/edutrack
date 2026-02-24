import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { ALL_SOIR_CLASSES } from "./soir.constants";

interface Creneau {
  id: string;
  classe: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  professeur?: string;
}

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function SoirEmploiDuTemps() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [filterClasse, setFilterClasse] = useState(ALL_SOIR_CLASSES[0] || "");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const canManage = user?.role === "admin" || user?.role === "gestionnaire";

  const [form, setForm] = useState({
    jour: "Lundi",
    heureDebut: "18:00",
    heureFin: "20:00",
    matiere: "",
    professeur: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const q = schoolId
        ? query(collection(db, "emploi_du_temps"), where("schoolId", "==", schoolId), where("programme", "==", "soir"), where("classe", "==", filterClasse))
        : query(collection(db, "emploi_du_temps"), where("programme", "==", "soir"), where("classe", "==", filterClasse));
      const snap = await getDocs(q);
      setCreneaux(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Creneau)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterClasse, schoolId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.matiere) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "emploi_du_temps"), {
        ...form,
        classe: filterClasse,
        programme: "soir",
        schoolId: schoolId || null,
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
      });
      setForm({ jour: "Lundi", heureDebut: "18:00", heureFin: "20:00", matiere: "", professeur: "" });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    await deleteDoc(doc(db, "emploi_du_temps", id));
    setCreneaux((prev) => prev.filter((c) => c.id !== id));
  };

  const inputStyle = { width: "100%", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text, boxSizing: "border-box" as const };

  // Group by jour
  const byJour: Record<string, Creneau[]> = {};
  JOURS.forEach((j) => { byJour[j] = creneaux.filter((c) => c.jour === j).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)); });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 4px" }}>Emploi du temps — Cours du soir</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Programme de la semaine</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: "10px 20px", background: colors.primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
          >
            {showForm ? "Annuler" : "+ Ajouter un créneau"}
          </button>
        )}
      </div>

      {/* Class filter */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ALL_SOIR_CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterClasse(c)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                background: filterClasse === c ? colors.primary : colors.bgHover,
                color: filterClasse === c ? "#fff" : colors.textMuted,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && canManage && (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: colors.text }}>Nouveau créneau — {filterClasse}</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>Jour</label>
                <select style={inputStyle} value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value })}>
                  {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>Début</label>
                <input type="time" style={inputStyle} value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>Fin</label>
                <input type="time" style={inputStyle} value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>Matière *</label>
                <input style={inputStyle} value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} placeholder="Lecture, Calcul..." required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>Professeur</label>
                <input style={inputStyle} value={form.professeur} onChange={(e) => setForm({ ...form, professeur: e.target.value })} placeholder="Nom du prof" />
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ marginTop: 14, padding: "10px 24px", background: saving ? colors.border : colors.success, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Ajout..." : "Ajouter"}
            </button>
          </form>
        </div>
      )}

      {/* Timetable */}
      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement…</p>
      ) : creneaux.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted, background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}` }}>
          <p>Aucun créneau pour {filterClasse}</p>
          {canManage && <button onClick={() => setShowForm(true)} style={{ marginTop: 8, padding: "8px 16px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Ajouter un créneau</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {JOURS.map((jour) => {
            const jCreneaux = byJour[jour] || [];
            if (jCreneaux.length === 0) return null;
            return (
              <div key={jour} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: colors.primary, color: "#fff" }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{jour}</span>
                </div>
                <div>
                  {jCreneaux.map((c) => (
                    <div key={c.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: colors.text }}>{c.matiere}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted }}>{c.heureDebut} – {c.heureFin}</p>
                          {c.professeur && <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted }}>{c.professeur}</p>}
                        </div>
                        {canManage && (
                          <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, fontSize: 16, padding: 0 }}>×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
