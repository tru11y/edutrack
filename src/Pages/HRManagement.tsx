import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { callFunction } from "../services/cloudFunctions";

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  motif: string;
  statut: string;
  createdAt: string | null;
  commentaire?: string;
}

const LEAVE_TYPES = ["Conge annuel", "Conge maladie", "Conge personnel", "Formation"];

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: "#fef3c7", text: "#b45309", label: "En attente" },
  approuve: { bg: "#d1fae5", text: "#065f46", label: "Approuve" },
  refuse: { bg: "#fee2e2", text: "#991b1b", label: "Refuse" },
};

export default function HRManagement() {
  const { colors } = useTheme();
  const { appUser } = useAuth();
  const isAdmin = appUser?.role === "admin" || appUser?.role === "gestionnaire";
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const res = await callFunction<{ requests: LeaveRequest[] }>("listLeaveRequests", { all: isAdmin });
      setRequests(res.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await callFunction("createLeaveRequest", { type, dateDebut, dateFin, motif });
      setDateDebut(""); setDateFin(""); setMotif("");
      setShowForm(false);
      loadRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, statut: "approuve" | "refuse") => {
    setUpdating(id);
    try {
      await callFunction("updateLeaveRequest", { id, statut });
      loadRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box" as const, background: colors.cardBg, color: colors.text,
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Gestion RH - Conges</h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
          cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>
          {showForm ? "Annuler" : "+ Demande de conge"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: "block" }}>Date debut</label>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, display: "block" }}>Date fin</label>
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (optionnel)" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <button onClick={handleCreate} disabled={saving || !dateDebut || !dateFin} style={{
              padding: "10px", background: dateDebut && dateFin ? "#6366f1" : "#d1d5db", color: "#fff",
              border: "none", borderRadius: 8, cursor: dateDebut && dateFin ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14,
            }}>
              {saving ? "Envoi..." : "Soumettre la demande"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.textSecondary }}>Chargement...</p>
      ) : requests.length === 0 ? (
        <p style={{ color: colors.textSecondary }}>Aucune demande de conge.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.map((req) => {
            const st = STATUT_STYLES[req.statut] || STATUT_STYLES.en_attente;
            return (
              <div key={req.id} style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>
                      {req.type} — {req.userName}
                    </h3>
                    <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
                      Du {req.dateDebut} au {req.dateFin}
                    </p>
                    {req.motif && <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 0" }}>Motif: {req.motif}</p>}
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.text }}>
                    {st.label}
                  </span>
                </div>
                {isAdmin && req.statut === "en_attente" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => handleUpdate(req.id, "approuve")} disabled={updating === req.id}
                      style={{ padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                      Approuver
                    </button>
                    <button onClick={() => handleUpdate(req.id, "refuse")} disabled={updating === req.id}
                      style={{ padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
