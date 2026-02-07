import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { createUserSecure, getCloudFunctionErrorMessage } from "../../services/cloudFunctions";

export default function CreateAdmin() {
  const { colors } = useTheme();
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

      await createUserSecure({
        email: form.email,
        password: form.password,
        role: "admin",
        nom: form.nom,
        prenom: form.prenom,
      });

      navigate("/admin/admins");
    } catch (e: unknown) {
      console.error(e);
      setError(getCloudFunctionErrorMessage(e));
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
            color: colors.textMuted,
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
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
          Nouvel administrateur
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, marginTop: 8 }}>
          Creer un compte administrateur avec acces complet
        </p>
      </div>

      {/* Form */}
      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 32,
        maxWidth: 600
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
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
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: "border-box",
                  background: colors.bgCard,
                  color: colors.text
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
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
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: "border-box",
                  background: colors.bgCard,
                  color: colors.text
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
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
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box",
                background: colors.bgCard,
                color: colors.text
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
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
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box",
                background: colors.bgCard,
                color: colors.text
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
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
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                boxSizing: "border-box",
                background: colors.bgCard,
                color: colors.text
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: colors.dangerBg,
              border: `1px solid ${colors.danger}`,
              borderRadius: 10,
              marginBottom: 20
            }}>
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: colors.gradientPrimary,
                color: colors.onGradient,
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
                background: colors.bgSecondary,
                color: colors.textMuted,
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
