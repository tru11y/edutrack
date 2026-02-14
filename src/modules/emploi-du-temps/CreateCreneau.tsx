import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { createCreneau } from "./emploi.service";
import { getAllProfesseurs } from "../professeurs/professeur.service";
import { JOURS } from "../../constants";
import type { Creneau } from "./emploi.types";
import type { Jour } from "../../constants";
import type { Professeur } from "../professeurs/professeur.types";

type CreneauForm = Omit<Creneau, "id" | "createdAt">;

export default function CreateCreneau({ onCreated }: { onCreated?: () => void }) {
  const { colors } = useTheme();
  const [profs, setProfs] = useState<Professeur[]>([]);
  const [form, setForm] = useState<CreneauForm>({
    jour: "lundi",
    heureDebut: "",
    heureFin: "",
    classe: "",
    matiere: "",
    professeurId: "",
    type: "renforcement",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllProfesseurs().then((data) => setProfs(data.filter((p) => p.statut === "actif")));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heureDebut || !form.heureFin || !form.classe || !form.matiere || !form.professeurId) {
      setError("Tous les champs sont requis.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createCreneau(form);
      setForm({ jour: "lundi", heureDebut: "", heureFin: "", classe: "", matiere: "", professeurId: "", type: "renforcement" });
      onCreated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la creation.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, background: colors.bgCard, color: colors.text, boxSizing: "border-box" as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: colors.bgCard, padding: 24, borderRadius: 12, border: `1px solid ${colors.border}` }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 16 }}>Nouveau creneau</h2>

      {error && (
        <div style={{ padding: "10px 14px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Jour</label>
          <select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value as Jour })} style={inputStyle}>
            {JOURS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "renforcement" | "soir" })} style={inputStyle}>
            <option value="renforcement">Renforcement</option>
            <option value="soir">Cours du soir</option>
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
          <input type="text" value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} placeholder="Ex: 3e" required style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Matiere</label>
          <input type="text" value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} placeholder="Ex: Maths" required style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Professeur</label>
          <select value={form.professeurId} onChange={(e) => setForm({ ...form, professeurId: e.target.value })} required style={inputStyle}>
            <option value="">Choisir un professeur</option>
            {profs.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: colors.primary, color: colors.bgCard, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
