import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import {
  sendBulkNotificationSecure,
  getCloudFunctionErrorMessage,
} from "../../services/cloudFunctions";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function NotificationSendForm() {
  const { colors } = useTheme();
  const toast = useToast();
  const [classes, setClasses] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetType: "all" as "all" | "classe" | "role",
    targetValue: "",
  });

  useEffect(() => {
    getDocs(collection(db, "classes")).then((snap) => {
      setClasses(snap.docs.map((d) => d.data().nom || d.id).sort());
    });
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.warning("Le titre et le message sont requis.");
      return;
    }
    setSending(true);
    try {
      const res = await sendBulkNotificationSecure(form);
      toast.success(res.message);
      setForm({ title: "", message: "", targetType: "all", targetValue: "" });
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1px solid ${colors.border}`, background: colors.bgCard,
    color: colors.text, fontSize: 14, boxSizing: "border-box" as const,
  };

  return (
    <form onSubmit={handleSend} style={{
      background: colors.bgCard, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: 24, maxWidth: 500,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
        Envoyer une notification
      </h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, display: "block", marginBottom: 4 }}>Destinataires</label>
        <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value as "all" | "classe" | "role", targetValue: "" })} style={inputStyle}>
          <option value="all">Tous les utilisateurs</option>
          <option value="classe">Une classe</option>
          <option value="role">Un role</option>
        </select>
      </div>

      {form.targetType === "classe" && (
        <div style={{ marginBottom: 12 }}>
          <select value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} style={inputStyle}>
            <option value="">Selectionnez une classe</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {form.targetType === "role" && (
        <div style={{ marginBottom: 12 }}>
          <select value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} style={inputStyle}>
            <option value="">Selectionnez un role</option>
            <option value="prof">Professeurs</option>
            <option value="eleve">Eleves</option>
            <option value="parent">Parents</option>
          </select>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, display: "block", marginBottom: 4 }}>Titre</label>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Titre de la notification" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, display: "block", marginBottom: 4 }}>Message</label>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Contenu du message" />
      </div>

      <button type="submit" disabled={sending} style={{
        padding: "10px 20px", borderRadius: 8, border: "none",
        background: colors.primary, color: "#fff", cursor: sending ? "not-allowed" : "pointer",
        fontSize: 14, fontWeight: 500, opacity: sending ? 0.7 : 1, width: "100%",
      }}>
        {sending ? "Envoi en cours..." : "Envoyer"}
      </button>
    </form>
  );
}
