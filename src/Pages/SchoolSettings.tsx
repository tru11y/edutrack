import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSchool } from "../context/SchoolContext";

interface SchoolForm {
  schoolName: string;
  adresse: string;
  telephone: string;
  email: string;
  anneeScolaire: string;
  schoolLogo: string;
}

export default function SchoolSettings() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { school } = useSchool();

  const [form, setForm] = useState<SchoolForm>({
    schoolName: "",
    adresse: "",
    telephone: "",
    email: "",
    anneeScolaire: "",
    schoolLogo: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setForm({
      schoolName: school.schoolName || "",
      adresse: school.adresse || "",
      telephone: school.telephone || "",
      email: school.email || "",
      anneeScolaire: school.anneeScolaire || "",
      schoolLogo: school.schoolLogo || "",
    });
  }, [school]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId && !user?.uid) return;
    setSaving(true);
    setMessage(null);
    try {
      const docRef = user?.schoolId
        ? doc(db, "schools", user.schoolId)
        : doc(db, "config", "school");

      // Check if the document exists
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, {
          ...form,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      } else {
        // If it doesn't exist, we can't create it here without setDoc
        // Fall back to config/school
        const fallbackRef = doc(db, "config", "school");
        await updateDoc(fallbackRef, {
          ...form,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      }

      setMessage({ type: "success", text: "Paramètres enregistrés avec succès." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    fontSize: 14,
    background: colors.bgInput ?? colors.bgHover,
    color: colors.text,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1V3M12 21V23M1 12H3M21 12H23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.text, margin: 0, letterSpacing: "-0.5px" }}>
              Paramètres de l'école
            </h1>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
              Informations et configuration de votre établissement
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* School Info Card */}
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.primary, display: "inline-block" }} />
            Informations générales
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nom de l'établissement *</label>
              <input
                style={inputStyle}
                value={form.schoolName}
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                placeholder="Ex: Collège Jean Moulin"
                required
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Adresse</label>
              <input
                style={inputStyle}
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                placeholder="Ex: 12 rue des Écoles, Douala"
              />
            </div>

            <div>
              <label style={labelStyle}>Téléphone</label>
              <input
                style={inputStyle}
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="Ex: +237 6XX XXX XXX"
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Ex: contact@ecole.cm"
              />
            </div>

            <div>
              <label style={labelStyle}>Année scolaire</label>
              <input
                style={inputStyle}
                value={form.anneeScolaire}
                onChange={(e) => setForm({ ...form, anneeScolaire: e.target.value })}
                placeholder="Ex: 2025-2026"
              />
            </div>

            <div>
              <label style={labelStyle}>URL du logo</label>
              <input
                style={inputStyle}
                value={form.schoolLogo}
                onChange={(e) => setForm({ ...form, schoolLogo: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {form.schoolLogo && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>Aperçu du logo :</span>
              <img
                src={form.schoolLogo}
                alt="Logo"
                style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 10, border: `1px solid ${colors.border}` }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 16,
            background: message.type === "success" ? colors.successBg : colors.dangerBg,
            border: `1px solid ${message.type === "success" ? colors.success : colors.danger}40`,
          }}>
            <p style={{ fontSize: 14, color: message.type === "success" ? colors.success : colors.danger, margin: 0 }}>
              {message.text}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 28px", background: saving ? colors.border : colors.primary,
              color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
