import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../services/firebase";
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
  primaryColor: string;
}

export default function SchoolSettings() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { school } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SchoolForm>({
    schoolName: "",
    adresse: "",
    telephone: "",
    email: "",
    anneeScolaire: "",
    schoolLogo: "",
    primaryColor: "#6366f1",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setForm({
      schoolName: school.schoolName || "",
      adresse: school.adresse || "",
      telephone: school.telephone || "",
      email: school.email || "",
      anneeScolaire: school.anneeScolaire || "",
      schoolLogo: school.schoolLogo || "",
      primaryColor: school.primaryColor || "#6366f1",
    });
  }, [school]);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    const schoolId = user?.schoolId || user?.uid || "default";
    const storageRef = ref(storage, `logos/${schoolId}/logo`);
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(pct);
          },
          (err) => {
            console.error(err);
            reject(err);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setForm((f) => ({ ...f, schoolLogo: url }));
            resolve();
          }
        );
      });
    } catch {
      setMessage({ type: "error", text: "Erreur lors de l'upload du logo." });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    setMessage(null);
    try {
      const docRef = user?.schoolId
        ? doc(db, "schools", user.schoolId)
        : doc(db, "config", "school");

      const snap = await getDoc(docRef);
      const payload = {
        ...form,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      if (snap.exists()) {
        await updateDoc(docRef, payload);
      } else {
        // Fallback: create or update config/school
        const fallbackRef = doc(db, "config", "school");
        const fallbackSnap = await getDoc(fallbackRef);
        if (fallbackSnap.exists()) {
          await updateDoc(fallbackRef, payload);
        } else {
          await setDoc(fallbackRef, payload);
        }
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
          </div>
        </div>

        {/* Branding Card */}
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.primary, display: "inline-block" }} />
            Personnalisation visuelle
          </h2>

          {/* Color picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Couleur principale</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                style={{ width: 48, height: 40, border: `1px solid ${colors.border}`, borderRadius: 8, cursor: "pointer", padding: 2, background: "none" }}
              />
              <input
                style={{ ...inputStyle, width: "auto", flex: 1 }}
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                placeholder="#6366f1"
                pattern="^#[0-9a-fA-F]{6}$"
              />
              <div
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.primaryColor}cc 100%)`,
                  border: `1px solid ${colors.border}`,
                  flexShrink: 0,
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: "6px 0 0" }}>
              Cette couleur sera appliquée au thème de l'interface et aux reçus PDF.
            </p>
          </div>

          {/* Logo upload */}
          <div>
            <label style={labelStyle}>Logo de l'école</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: "10px 18px",
                  background: uploading ? colors.bgHover : colors.primaryBg,
                  color: uploading ? colors.textMuted : colors.primary,
                  border: `1px solid ${colors.primary}40`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v9M5 4l3-3 3 3M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {uploading ? `Upload ${uploadProgress}%…` : "Choisir un fichier"}
              </button>

              {uploading && (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ height: 6, borderRadius: 3, background: colors.border, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${uploadProgress}%`, background: colors.primary, transition: "width 0.2s" }} />
                  </div>
                </div>
              )}

              {form.schoolLogo && !uploading && (
                <img
                  src={form.schoolLogo}
                  alt="Logo"
                  style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 10, border: `1px solid ${colors.border}` }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>

            {form.schoolLogo && (
              <div style={{ marginTop: 10 }}>
                <label style={labelStyle}>URL du logo (ou coller une URL directement)</label>
                <input
                  style={inputStyle}
                  value={form.schoolLogo}
                  onChange={(e) => setForm({ ...form, schoolLogo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            {!form.schoolLogo && (
              <div style={{ marginTop: 8 }}>
                <label style={labelStyle}>Ou coller l'URL directement</label>
                <input
                  style={inputStyle}
                  value={form.schoolLogo}
                  onChange={(e) => setForm({ ...form, schoolLogo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
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
            disabled={saving || uploading}
            style={{
              padding: "12px 28px", background: (saving || uploading) ? colors.border : colors.primary,
              color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: (saving || uploading) ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
