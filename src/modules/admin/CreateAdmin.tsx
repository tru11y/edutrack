import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../services/firebase";

export default function CreateAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Tous les champs sauf telephone sont obligatoires");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit avoir au moins 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1) Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 2) Créer le document utilisateur dans Firestore avec l'UID comme ID
      await setDoc(doc(db, "users", userCredential.user.uid), {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone || null,
        role: "admin",
        isActive: true,
        createdAt: serverTimestamp(),
      });

      navigate("/admin/admins");
    } catch (e: unknown) {
      console.error(e);
      const firebaseError = e as { code?: string; message?: string };
      if (firebaseError.code === "auth/email-already-in-use") {
        setError("Cet email est deja utilise");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Email invalide");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("Mot de passe trop faible");
      } else {
        setError("Erreur lors de la creation de l'administrateur");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          to="/admin/admins"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#64748b",
            textDecoration: "none",
            fontSize: 14,
            marginBottom: 16
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour aux administrateurs
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Nouvel administrateur
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", marginTop: 8 }}>
          Creer un compte administrateur avec acces complet
        </p>
      </div>

      {/* Form */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        padding: 32,
        maxWidth: 600
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
                Nom *
              </label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
                Prenom *
              </label>
              <input
                type="text"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
              Mot de passe * (min. 6 caracteres)
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
              Telephone
            </label>
            <input
              type="tel"
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              marginBottom: 20
            }}>
              <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Creation..." : "Creer l'administrateur"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "12px 24px",
                background: "#f1f5f9",
                color: "#64748b",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
