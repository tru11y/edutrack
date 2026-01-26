import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../services/firebase";

interface UserData {
  id: string;
  email: string;
  role: "admin" | "prof";
  isActive: boolean;
  nom?: string;
  prenom?: string;
  createdAt?: unknown;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    role: "prof" as "admin" | "prof",
  });

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

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      // Create Firestore user document with uid as document ID
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20, border: "1px solid #c7d2fe" }}>
          <p style={{ fontSize: 13, color: "#6366f1", margin: "0 0 8px" }}>Administrateurs</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#4f46e5", margin: 0 }}>{admins.length}</p>
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
            {admins.map((user) => (
              <div key={user.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 16 }}>
                    {(user.prenom?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: "#1e293b" }}>{user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email.split("@")[0]}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{user.email}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ padding: "4px 12px", background: "#eef2ff", color: "#6366f1", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Admin</span>
                  <span style={{ padding: "4px 12px", background: user.isActive ? "#ecfdf5" : "#fef2f2", color: user.isActive ? "#10b981" : "#ef4444", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            ))}
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
            {profs.map((user) => (
              <div key={user.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 16 }}>
                    {(user.prenom?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: "#1e293b" }}>{user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email.split("@")[0]}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{user.email}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "4px 12px", background: "#ecfdf5", color: "#10b981", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Prof</span>
                  <button
                    onClick={() => toggleUserStatus(user)}
                    style={{
                      padding: "6px 12px",
                      background: user.isActive ? "#fffbeb" : "#ecfdf5",
                      color: user.isActive ? "#f59e0b" : "#10b981",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    {user.isActive ? "Desactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    style={{
                      padding: "6px 12px",
                      background: "#fef2f2",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1e293b", margin: "0 0 24px" }}>Nouvel utilisateur</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Prenom</label>
                  <input type="text" name="prenom" value={form.prenom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Nom</label>
                  <input type="text" name="nom" value={form.nom} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Mot de passe *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>Role</label>
                <select name="role" value={form.role} onChange={handleChange} style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", boxSizing: "border-box" }}>
                  <option value="prof">Professeur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creation..." : "Creer"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setError(""); }} style={{ flex: 1, padding: "14px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
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
