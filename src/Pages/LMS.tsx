import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { callFunction } from "../services/cloudFunctions";

interface Assignment {
  id: string;
  titre: string;
  description: string;
  classe: string;
  matiere: string;
  dateLimite: string;
  profId: string;
  createdAt: string | null;
}

export default function LMS() {
  const { colors } = useTheme();
  const { appUser } = useAuth();
  const isStaff = appUser?.role === "admin" || appUser?.role === "gestionnaire" || appUser?.role === "professeur";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [classe, setClasse] = useState("");
  const [matiere, setMatiere] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await callFunction<{ assignments: Assignment[] }>("listAssignments", {});
      setAssignments(res.assignments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await callFunction("createAssignment", { titre, description, classe, matiere, dateLimite });
      setTitre(""); setDescription(""); setClasse(""); setMatiere(""); setDateLimite("");
      setShowForm(false);
      loadAssignments();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box" as const, background: colors.cardBg, color: colors.text,
  };

  const isOverdue = (dateLimite: string) => new Date(dateLimite) < new Date();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Devoirs & Travaux (LMS)</h1>
        {isStaff && (
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            {showForm ? "Annuler" : "+ Nouveau devoir"}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre du devoir *" style={inputStyle} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description / consignes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 12 }}>
              <input value={classe} onChange={(e) => setClasse(e.target.value)} placeholder="Classe *" style={{ ...inputStyle, flex: 1 }} />
              <input value={matiere} onChange={(e) => setMatiere(e.target.value)} placeholder="Matiere *" style={{ ...inputStyle, flex: 1 }} />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Date limite *</label>
                <input type="date" value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <button onClick={handleCreate} disabled={saving || !titre.trim() || !classe.trim() || !matiere.trim() || !dateLimite} style={{
              padding: "10px", background: titre.trim() && classe.trim() && matiere.trim() && dateLimite ? "#6366f1" : "#d1d5db",
              color: "#fff", border: "none", borderRadius: 8,
              cursor: titre.trim() && classe.trim() && matiere.trim() && dateLimite ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: 14,
            }}>
              {saving ? "Creation..." : "Creer le devoir"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.textSecondary }}>Chargement...</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: colors.textSecondary }}>Aucun devoir publie.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {assignments.map((a) => (
            <div key={a.id} style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>{a.titre}</h3>
                  <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 4px" }}>
                    {a.matiere} — {a.classe}
                  </p>
                  {a.description && <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 0" }}>{a.description}</p>}
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: isOverdue(a.dateLimite) ? "#fee2e2" : "#dbeafe",
                  color: isOverdue(a.dateLimite) ? "#991b1b" : "#1d4ed8",
                }}>
                  {isOverdue(a.dateLimite) ? "Expire" : `Limite: ${a.dateLimite}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
