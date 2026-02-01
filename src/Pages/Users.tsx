import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { db, auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface UserData {
  id: string;
  email: string;
  role: "admin" | "gestionnaire" | "prof";
  isActive: boolean;
  nom?: string;
  prenom?: string;
  createdAt?: unknown;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    role: "prof" as "admin" | "gestionnaire" | "prof",
  });
  const [editForm, setEditForm] = useState({
    email: "",
    nom: "",
    prenom: "",
    role: "prof" as "admin" | "gestionnaire" | "prof",
    newPassword: "",
  });

  const isAdmin = currentUser?.role === "admin";
  const isGestionnaire = currentUser?.role === "gestionnaire";

  const loadUsers = async () => {
    try {
      setLoadError(null);
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as UserData[];
      setUsers(data.sort((a, b) => (a.email || "").localeCompare(b.email || "")));
    } catch (err) {
      console.error("Erreur chargement users:", err);
      setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email et mot de passe obligatoires");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caracteres");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Utiliser une app Firebase secondaire pour ne pas deconnecter l'admin actuel
      const firebaseConfig = auth.app.options;
      const secondaryApp = initializeApp(firebaseConfig, "secondary-" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
        const uid = userCredential.user.uid;

        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          uid: uid,
          email: form.email,
          nom: form.nom || "",
          prenom: form.prenom || "",
          role: form.role,
          isActive: true,
          createdAt: serverTimestamp(),
        });

        setShowModal(false);
        setForm({ email: "", password: "", nom: "", prenom: "", role: "prof" });
        await loadUsers();
      } finally {
        // Supprimer l'app secondaire
        await deleteApp(secondaryApp);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("Cet email est deja utilise");
        } else {
          setError(err.message);
        }
      } else {
        setError("Erreur lors de la creation");
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      email: user.email || "",
      nom: user.nom || "",
      prenom: user.prenom || "",
      role: user.role,
      newPassword: "",
    });
    setError("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      setError("");

      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        nom: editForm.nom,
        prenom: editForm.prenom,
        role: editForm.role,
      });

      // Si un nouveau mot de passe est defini, on ne peut pas le changer directement
      // car Firebase Admin SDK est necessaire. On affiche un message.
      if (editForm.newPassword) {
        setError("Le mot de passe ne peut etre modifie directement. Utilisez 'Envoyer email de reinitialisation'.");
        setSaving(false);
        return;
      }

      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`Email de reinitialisation envoye a ${email}`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: unknown) {
      console.error("Erreur reset password:", err);
      let errorMsg = "Erreur lors de l'envoi de l'email";
      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) {
          errorMsg = "Aucun compte associe a cet email";
        } else if (err.message.includes("invalid-email")) {
          errorMsg = "Adresse email invalide";
        } else if (err.message.includes("too-many-requests")) {
          errorMsg = "Trop de tentatives. Reessayez plus tard";
        } else if (err.message.includes("network")) {
          errorMsg = "Erreur reseau. Verifiez votre connexion";
        }
      }
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    }
  };

  const toggleUserStatus = async (user: UserData) => {
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive,
      });
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise a jour");
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    // Admin2 ne peut pas supprimer directement - envoie une demande
    if (isGestionnaire) {
      if (!window.confirm(`Envoyer une demande de suppression pour ${user.email} ?`)) return;
      try {
        await addDoc(collection(db, "demandes_suppression"), {
          userId: user.id,
          userEmail: user.email,
          userName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email,
          requestedBy: currentUser?.email,
          requestedAt: serverTimestamp(),
          status: "pending",
        });
        setSuccessMessage("Demande de suppression envoyee");
        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'envoi de la demande");
      }
      return;
    }

    // Admin peut supprimer directement
    if (!window.confirm(`Supprimer l'utilisateur ${user.email} ? Cette action est irreversible.`)) return;
    try {
      const userRef = doc(db, "users", user.id);
      await deleteDoc(userRef);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const admins = users.filter((u) => u.role === "admin");
  const gestionnaires = users.filter((u) => u.role === "gestionnaire");
  const profs = users.filter((u) => u.role === "prof");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>Erreur de chargement</h2>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>{loadError}</p>
        <button
          onClick={() => { setLoading(true); loadUsers(); }}
          style={{ padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          Reessayer
        </button>
      </div>
    );
  }

  // Admin2 ne peut pas modifier/supprimer un admin
  const canEditUser = (targetUser: UserData) => {
    if (isAdmin) return true;
    if (isGestionnaire && targetUser.role === "admin") return false;
    return true;
  };

  const canDeleteUser = (_targetUser: UserData) => {
    if (isAdmin) return true;
    // Admin2 ne peut pas supprimer
    return false;
  };

  const renderUserCard = (user: UserData, bgGradient: string, roleLabel: string, roleColor: string, roleBg: string) => (
    <div key={user.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bgGradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 16 }}>
          {(user.prenom?.[0] || user.email?.[0] || "?").toUpperCase()}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 500, color: "#1e293b" }}>{user.prenom && user.nom ? `${user.prenom} ${user.nom}` : (user.email?.split("@")[0] || "Inconnu")}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{user.email || "Pas d'email"}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ padding: "4px 12px", background: roleBg, color: roleColor, borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{roleLabel}</span>
        <span style={{ padding: "4px 12px", background: user.isActive ? "#ecfdf5" : "#fef2f2", color: user.isActive ? "#10b981" : "#ef4444", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
          {user.isActive ? "Actif" : "Inactif"}
        </span>
        {canEditUser(user) && (
          <button
            onClick={() => openEditModal(user)}
            style={{ padding: "6px 12px", background: "#eef2ff", color: "#6366f1", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            Modifier
          </button>
        )}
        {canEditUser(user) && (
          <button
            onClick={() => sendPasswordReset(user.email)}
            style={{ padding: "6px 12px", background: "#fef3c7", color: "#d97706", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            Reset MDP
          </button>
        )}
        {canEditUser(user) && (
          <button
            onClick={() => toggleUserStatus(user)}
            style={{ padding: "6px 12px", background: user.isActive ? "#fffbeb" : "#ecfdf5", color: user.isActive ? "#f59e0b" : "#10b981", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            {user.isActive ? "Desactiver" : "Activer"}
          </button>
        )}
        {canDeleteUser(user) && (
          <button
            onClick={() => handleDeleteUser(user)}
            style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21M23 21V19C23 17.14 21.87 15.57 20.24 15.13M16.24 3.13C17.87 3.57 19 5.14 19 7C19 8.86 17.87 10.43 16.24 10.87M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Utilisateurs</h1>
              <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: "12px 20px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{ padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: "#10b981", margin: 0 }}>{successMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20, border: "1px solid #c7d2fe" }}>
          <p style={{ fontSize: 13, color: "#6366f1", margin: "0 0 8px" }}>Administrateurs</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#4f46e5", margin: 0 }}>{admins.length}</p>
        </div>
        <div style={{ background: "#fef3c7", borderRadius: 12, padding: 20, border: "1px solid #fcd34d" }}>
          <p style={{ fontSize: 13, color: "#d97706", margin: "0 0 8px" }}>Gestionnaire</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#b45309", margin: 0 }}>{gestionnaires.length}</p>
        </div>
        <div style={{ background: "#ecfdf5", borderRadius: 12, padding: 20, border: "1px solid #a7f3d0" }}>
          <p style={{ fontSize: 13, color: "#10b981", margin: "0 0 8px" }}>Professeurs</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#059669", margin: 0 }}>{profs.length}</p>
        </div>
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 16px" }}>Administrateurs</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {admins.map((user) => renderUserCard(user, "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", "Admin", "#6366f1", "#eef2ff"))}
          </div>
        </div>
      )}

      {/* Gestionnaire */}
      {gestionnaires.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 16px" }}>Gestionnaire</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gestionnaires.map((user) => renderUserCard(user, "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", "Gestionnaire", "#d97706", "#fef3c7"))}
          </div>
        </div>
      )}

      {/* Professeurs */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 16px" }}>Professeurs</h2>
        {profs.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 40, textAlign: "center" }}>
            <p style={{ color: "#64748b", margin: 0 }}>Aucun professeur</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {profs.map((user) => renderUserCard(user, "linear-gradient(135deg, #10b981 0%, #059669 100%)", "Prof", "#10b981", "#ecfdf5"))}
          </div>
        )}
      </div>

      {/* Modal Ajouter */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: colors.bgCard, borderRadius: 16, padding: 32, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 24px" }}>Nouvel utilisateur</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Prenom</label>
                  <input type="text" name="prenom" value={form.prenom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Nom</label>
                  <input type="text" name="nom" value={form.nom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Mot de passe *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Role</label>
                <select name="role" value={form.role} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}>
                  <option value="prof">Professeur</option>
                  <option value="gestionnaire">Gestionnaire</option>
                  {isAdmin && <option value="admin">Administrateur</option>}
                </select>
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}30`, borderRadius: 10, marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: "14px", background: `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creation..." : "Creer"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setError(""); }} style={{ flex: 1, padding: "14px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {showEditModal && editingUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: colors.bgCard, borderRadius: 16, padding: 32, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>Modifier l'utilisateur</h2>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: "0 0 24px" }}>{editingUser.email}</p>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Prenom</label>
                  <input type="text" name="prenom" value={editForm.prenom} onChange={handleEditChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Nom</label>
                  <input type="text" name="nom" value={editForm.nom} onChange={handleEditChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Role</label>
                <select name="role" value={editForm.role} onChange={handleEditChange} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}>
                  <option value="prof">Professeur</option>
                  <option value="gestionnaire">Gestionnaire</option>
                  {isAdmin && <option value="admin">Administrateur</option>}
                </select>
              </div>

              <div style={{ padding: 16, background: colors.bgSecondary, borderRadius: 10, marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, margin: "0 0 12px" }}>Mot de passe</p>
                <button
                  type="button"
                  onClick={() => sendPasswordReset(editingUser.email)}
                  style={{ width: "100%", padding: "12px", background: colors.warningBg, color: colors.warning, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
                >
                  Envoyer email de reinitialisation
                </button>
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}30`, borderRadius: 10, marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: "14px", background: `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingUser(null); setError(""); }} style={{ flex: 1, padding: "14px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
