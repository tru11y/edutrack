import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useOnboarding } from "../components/onboarding/OnboardingProvider";

interface UserProfile { nom?: string; prenom?: string; email?: string; telephone?: string; role?: string; }

export default function Profil() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { restartOnboarding } = useOnboarding();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const loadProfile = async () => {
      try { const snap = await getDoc(doc(db, "users", user.uid)); if (snap.exists()) { const data = snap.data() as UserProfile; setProfile(data); setForm({ nom: data.nom || "", prenom: data.prenom || "", telephone: data.telephone || "" }); } } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadProfile();
  }, [user?.uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setForm({ ...form, [e.target.name]: e.target.value }); };

  const handleSave = async () => {
    if (!user?.uid) return;
    try { setSaving(true); setMessage({ type: "", text: "" }); await updateDoc(doc(db, "users", user.uid), { nom: form.nom.trim(), prenom: form.prenom.trim(), telephone: form.telephone.trim(), updatedAt: serverTimestamp() }); setProfile({ ...profile, nom: form.nom.trim(), prenom: form.prenom.trim(), telephone: form.telephone.trim() }); setEditing(false); setMessage({ type: "success", text: "Profil mis a jour" }); } catch (err) { console.error(err); setMessage({ type: "error", text: "Erreur" }); } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" }); return; }
    if (passwordForm.newPassword.length < 6) { setMessage({ type: "error", text: "Minimum 6 caracteres" }); return; }
    try {
      setChangingPassword(true); setMessage({ type: "", text: "" });
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("Non connecte");
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setShowPasswordForm(false); setMessage({ type: "success", text: "Mot de passe modifie" });
    } catch (err: unknown) { console.error(err); setMessage({ type: "error", text: err instanceof Error && err.message.includes("wrong-password") ? "Mot de passe incorrect" : "Erreur" }); } finally { setChangingPassword(false); }
  };

  if (loading) {
    return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}><div style={{ textAlign: "center" }}><div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>);
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}><h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>Mon profil</h1><p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Gerez vos informations</p></div>

      {message.text && <div style={{ padding: "12px 16px", background: message.type === "success" ? colors.successBg : colors.dangerBg, border: `1px solid ${message.type === "success" ? `${colors.success}40` : colors.danger}`, borderRadius: 10, marginBottom: 24 }}><p style={{ fontSize: 14, color: message.type === "success" ? colors.success : colors.danger, margin: 0 }}>{message.text}</p></div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ padding: 24, background: colors.gradientPrimary, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: colors.onGradientOverlay, display: "flex", alignItems: "center", justifyContent: "center", color: colors.onGradient, fontSize: 28, fontWeight: 700 }}>{(profile.prenom?.[0] || user?.email?.[0] || "A").toUpperCase()}{(profile.nom?.[0] || "").toUpperCase()}</div>
            <div><h2 style={{ fontSize: 22, fontWeight: 700, color: colors.onGradient, margin: "0 0 4px" }}>{profile.prenom && profile.nom ? `${profile.prenom} ${profile.nom}` : user?.email?.split("@")[0] || "Admin"}</h2><p style={{ fontSize: 14, color: colors.onGradientMuted, margin: 0 }}>{profile.role === "admin" ? "Administrateur" : profile.role || "Utilisateur"}</p></div>
          </div>
          <div style={{ padding: 24 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Prenom</label><input type="text" name="prenom" value={form.prenom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Nom</label><input type="text" name="nom" value={form.nom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Telephone</label><input type="tel" name="telephone" value={form.telephone} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} /></div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", background: colors.success, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "..." : "Enregistrer"}</button>
                  <button onClick={() => setEditing(false)} style={{ padding: "12px 24px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gap: 16 }}>
                  <div><p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>Email</p><p style={{ fontSize: 15, color: colors.text, margin: 0, fontWeight: 500 }}>{user?.email || "Non renseigne"}</p></div>
                  <div><p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>Prenom</p><p style={{ fontSize: 15, color: colors.text, margin: 0, fontWeight: 500 }}>{profile.prenom || "Non renseigne"}</p></div>
                  <div><p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>Nom</p><p style={{ fontSize: 15, color: colors.text, margin: 0, fontWeight: 500 }}>{profile.nom || "Non renseigne"}</p></div>
                  <div><p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>Telephone</p><p style={{ fontSize: 15, color: colors.text, margin: 0, fontWeight: 500 }}>{profile.telephone || "Non renseigne"}</p></div>
                </div>
                <button onClick={() => setEditing(true)} style={{ marginTop: 24, padding: "12px 24px", background: colors.primary, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Modifier</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Securite</h2>
          {showPasswordForm ? (
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 20 }}><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Mot de passe actuel</label><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} /></div>
              <div style={{ marginBottom: 20 }}><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Nouveau mot de passe</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} /></div>
              <div style={{ marginBottom: 24 }}><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Confirmer</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgCard, color: colors.text }} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={changingPassword} style={{ padding: "12px 24px", background: colors.success, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: changingPassword ? "not-allowed" : "pointer", opacity: changingPassword ? 0.7 : 1 }}>{changingPassword ? "..." : "Modifier"}</button>
                <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }} style={{ padding: "12px 24px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
              </div>
            </form>
          ) : (
            <div><p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>Modifiez votre mot de passe pour renforcer la securite.</p><button onClick={() => setShowPasswordForm(true)} style={{ padding: "12px 24px", background: colors.bgSecondary, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Changer le mot de passe</button></div>
          )}
        </div>

        {/* Onboarding tour restart */}
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 12px" }}>Guide</h2>
          <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
            {language === "en" ? "Review the guided tour of the application." : "Revoyez la visite guidee de l'application."}
          </p>
          <button onClick={restartOnboarding} style={{ padding: "12px 24px", background: colors.primary, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            {t("restartTour")}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
