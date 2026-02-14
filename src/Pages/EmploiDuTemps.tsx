import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { getCreneaux, createCreneau, deleteCreneau } from "../modules/emploi-du-temps/emploi.service";
import { getAllProfesseurs } from "../modules/professeurs/professeur.service";
import { JOURS } from "../constants";
import type { Creneau } from "../modules/emploi-du-temps/emploi.types";
import type { Jour } from "../constants";
import type { Professeur } from "../modules/professeurs/professeur.types";

interface ClasseOption {
  id: string;
  nom: string;
}

interface MatiereOption {
  id: string;
  nom: string;
}

const EMPTY_FORM = {
  jour: "lundi" as Jour,
  heureDebut: "",
  heureFin: "",
  classe: "",
  matiere: "",
  professeurId: "",
  type: "renforcement" as "renforcement" | "soir",
};

export default function EmploiDuTemps() {
  const { colors } = useTheme();
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [profs, setProfs] = useState<Professeur[]>([]);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filtre par jour - par defaut le jour actuel
  const todayIndex = new Date().getDay();
  const defaultJour = todayIndex === 0 ? JOURS[0] : JOURS[todayIndex - 1] || JOURS[0];
  const [filterJour, setFilterJour] = useState<Jour | "">(defaultJour);

  const loadData = async () => {
    try {
      const [c, p, classesSnap, matieresSnap] = await Promise.all([
        getCreneaux(),
        getAllProfesseurs(),
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "matieres")),
      ]);
      setCreneaux(c);
      setProfs(p.filter((pr) => pr.statut === "actif"));
      setClasses(classesSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
      setMatieres(matieresSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heureDebut || !form.heureFin || !form.classe || !form.matiere || !form.professeurId) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (form.heureDebut >= form.heureFin) {
      setError("L'heure de fin doit etre apres l'heure de debut.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createCreneau(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la creation.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce creneau ?")) return;
    try {
      await deleteCreneau(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getProfNom = (profId: string): string => {
    const prof = profs.find((p) => p.id === profId);
    return prof ? `${prof.prenom} ${prof.nom}` : profId;
  };

  const filtered = creneaux
    .filter((c) => !filterJour || c.jour === filterJour)
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, background: colors.bgCard, color: colors.text, boxSizing: "border-box" as const,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Emploi du temps</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{creneaux.length} creneau{creneaux.length > 1 ? "x" : ""}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: "12px 20px", background: colors.primary, color: colors.bgCard, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            {showForm ? "Annuler" : "+ Creneau"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
          {error && (
            <div style={{ padding: "10px 14px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Jour</label>
              <select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value as Jour })} style={inputStyle}>
                {JOURS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Debut</label>
              <input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Fin</label>
              <input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Classe</label>
              <select value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} required style={inputStyle}>
                <option value="">Choisir une classe</option>
                {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Matiere</label>
              <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} required style={inputStyle}>
                <option value="">Choisir une matiere</option>
                {matieres.map((m) => <option key={m.id} value={m.nom}>{m.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Professeur</label>
              <select value={form.professeurId} onChange={(e) => setForm({ ...form, professeurId: e.target.value })} required style={inputStyle}>
                <option value="">Choisir un professeur</option>
                {profs.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "renforcement" | "soir" })} style={inputStyle}>
                <option value="renforcement">Renforcement</option>
                <option value="soir">Cours du soir</option>
              </select>
            </div>
            <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: colors.primary, color: colors.bgCard, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, marginTop: 20 }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: colors.bgSecondary, borderRadius: 12, padding: 4, overflowX: "auto" }}>
        <button onClick={() => setFilterJour("")} style={{ padding: "10px 16px", background: !filterJour ? colors.bgCard : "transparent", border: !filterJour ? `1px solid ${colors.border}` : "1px solid transparent", borderRadius: 8, fontSize: 13, fontWeight: 500, color: !filterJour ? colors.text : colors.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>
          Tous
        </button>
        {JOURS.map((j) => (
          <button key={j} onClick={() => setFilterJour(j)} style={{ padding: "10px 16px", background: filterJour === j ? colors.bgCard : "transparent", border: filterJour === j ? `1px solid ${colors.border}` : "1px solid transparent", borderRadius: 8, fontSize: 13, fontWeight: 500, color: filterJour === j ? colors.text : colors.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>
            {j.charAt(0).toUpperCase() + j.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun creneau{filterJour ? ` pour ${filterJour}` : ""}</p>
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                {["Jour", "Horaire", "Classe", "Matiere", "Professeur", "Type", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14, textTransform: "capitalize" }}>{c.jour}</td>
                  <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: 14 }}>{c.heureDebut} - {c.heureFin}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>{c.classe}</td>
                  <td style={{ padding: "14px 20px", color: colors.text, fontSize: 14 }}>{c.matiere}</td>
                  <td style={{ padding: "14px 20px", color: colors.text, fontSize: 14 }}>{getProfNom(c.professeurId)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: c.type === "soir" ? colors.primaryBg : colors.infoBg, color: c.type === "soir" ? colors.primary : colors.info }}>
                      {c.type === "soir" ? "Soir" : "Renforcement"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => c.id && handleDelete(c.id)} style={{ padding: "6px 12px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 6, fontSize: 12, color: colors.danger, cursor: "pointer" }}>
                      Supprimer
                    </button>
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
