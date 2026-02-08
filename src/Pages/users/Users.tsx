import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { db, auth } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LoadingSpinner } from "../../components/ui/Skeleton";
import { GRADIENTS, TIMING } from "../../constants";
import { UserCard, UserStatsGrid, CreateUserModal, EditUserModal } from "./components";
import type { UserData, ClasseData, UserFormData } from "./types";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();

  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClasseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = currentUser?.role === "admin";
  const isGestionnaire = currentUser?.role === "gestionnaire";

  // Data loading
  const loadUsers = useCallback(async () => {
    try {
      setLoadError(null);
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserData[];
      setUsers(data.sort((a, b) => (a.email || "").localeCompare(b.email || "")));
    } catch (err) {
      console.error("Erreur chargement users:", err);
      setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "classes"));
      const data = snap.docs.map((d) => ({ id: d.id, nom: d.data().nom })) as ClasseData[];
      setAvailableClasses(data.sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch (err) {
      console.error("Erreur chargement classes:", err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadClasses();
  }, [loadUsers, loadClasses]);

  // Helpers
  const showSuccessTemp = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), TIMING.TOAST_DURATION_MS);
  };

  const showErrorTemp = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), TIMING.TOAST_DURATION_MS);
  };

  const canEditUser = (targetUser: UserData) => {
    if (isAdmin) return true;
    if (isGestionnaire && targetUser.role === "admin") return false;
    return true;
  };

  const canDeleteUser = () => isAdmin;

  // Handlers
  const handleCreateUser = async (form: UserFormData) => {
    const firebaseConfig = auth.app.options;
    const secondaryApp = initializeApp(firebaseConfig, "secondary-" + Date.now());
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      const uid = userCredential.user.uid;

      const userData: Record<string, unknown> = {
        uid,
        email: form.email,
        nom: form.nom || "",
        prenom: form.prenom || "",
        role: form.role,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      if (form.role === "prof" && form.classesEnseignees.length > 0) {
        userData.classesEnseignees = form.classesEnseignees;
      }

      await setDoc(doc(db, "users", uid), userData);
      await loadUsers();
    } finally {
      await deleteApp(secondaryApp);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccessTemp(`Email de reinitialisation envoye a ${email}`);
    } catch (err: unknown) {
      let errorMsg = "Erreur lors de l'envoi de l'email";
      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) errorMsg = "Aucun compte associe a cet email";
        else if (err.message.includes("invalid-email")) errorMsg = "Adresse email invalide";
        else if (err.message.includes("too-many-requests")) errorMsg = "Trop de tentatives. Reessayez plus tard";
        else if (err.message.includes("network")) errorMsg = "Erreur reseau. Verifiez votre connexion";
      }
      showErrorTemp(errorMsg);
    }
  };

  const toggleUserStatus = async (user: UserData) => {
    try {
      await updateDoc(doc(db, "users", user.id), { isActive: !user.isActive });
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise a jour");
    }
  };

  const handleDeleteUser = async (user: UserData) => {
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
        showSuccessTemp("Demande de suppression envoyee");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'envoi de la demande");
      }
      return;
    }

    if (!window.confirm(`Supprimer l'utilisateur ${user.email} ? Cette action est irreversible.`)) return;
    try {
      await deleteDoc(doc(db, "users", user.id));
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleEditUser = async (userId: string, data: { nom: string; prenom: string; role: string; classesEnseignees: string[] }) => {
    const updateData: Record<string, unknown> = {
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      updatedAt: serverTimestamp(),
    };
    if (data.role === "prof") {
      updateData.classesEnseignees = data.classesEnseignees;
    } else {
      updateData.classesEnseignees = [];
    }
    await updateDoc(doc(db, "users", userId), updateData);
    await loadUsers();
    showSuccessTemp("Utilisateur modifie avec succes");
  };

  // Categorized users
  const admins = users.filter((u) => u.role === "admin");
  const gestionnaires = users.filter((u) => u.role === "gestionnaire");
  const profs = users.filter((u) => u.role === "prof");

  if (loading) {
    return <LoadingSpinner text="Chargement des utilisateurs..." />;
  }

  if (loadError) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: colors.dangerBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>Erreur de chargement</h2>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: "0 0 16px" }}>{loadError}</p>
        <button
          onClick={() => {
            setLoading(true);
            loadUsers();
          }}
          style={{
            padding: "10px 20px",
            background: colors.primary,
            color: colors.onGradient,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: colors.primaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.primary,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21M23 21V19C23 17.14 21.87 15.57 20.24 15.13M16.24 3.13C17.87 3.57 19 5.14 19 7C19 8.86 17.87 10.43 16.24 10.87M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Utilisateurs</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
                {users.length} utilisateur{users.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "12px 20px",
              background: GRADIENTS.primary,
              color: colors.onGradient,
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div style={{ padding: "12px 16px", background: colors.successBg, border: `1px solid ${colors.success}40`, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: colors.success, margin: 0 }}>{successMessage}</p>
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      <UserStatsGrid admins={admins.length} gestionnaires={gestionnaires.length} profs={profs.length} />

      {/* Admins */}
      {admins.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Administrateurs</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {admins.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                canEdit={canEditUser(user)}
                canDelete={canDeleteUser()}
                onEdit={() => setEditingUser(user)}
                onResetPassword={() => sendPasswordReset(user.email)}
                onToggleStatus={() => toggleUserStatus(user)}
                onDelete={() => handleDeleteUser(user)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gestionnaires */}
      {gestionnaires.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Gestionnaires</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gestionnaires.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                canEdit={canEditUser(user)}
                canDelete={canDeleteUser()}
                onEdit={() => setEditingUser(user)}
                onResetPassword={() => sendPasswordReset(user.email)}
                onToggleStatus={() => toggleUserStatus(user)}
                onDelete={() => handleDeleteUser(user)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Professeurs */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Professeurs</h2>
        {profs.length === 0 ? (
          <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 40, textAlign: "center" }}>
            <p style={{ color: colors.textMuted, margin: 0 }}>Aucun professeur</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {profs.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                canEdit={canEditUser(user)}
                canDelete={canDeleteUser()}
                onEdit={() => setEditingUser(user)}
                onResetPassword={() => sendPasswordReset(user.email)}
                onToggleStatus={() => toggleUserStatus(user)}
                onDelete={() => handleDeleteUser(user)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Creer */}
      {showModal && (
        <CreateUserModal
          isAdmin={isAdmin}
          availableClasses={availableClasses}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Modal Modifier */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isAdmin={isAdmin}
          availableClasses={availableClasses}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditUser}
        />
      )}
    </div>
  );
}
