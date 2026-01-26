import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: 20
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: "none"
      }} />

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "40px 40px 32px",
          textAlign: "center",
          borderBottom: "1px solid #f0f0f0"
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 10px 20px -5px rgba(102, 126, 234, 0.4)"
          }}>
            <span style={{ fontSize: 28, color: "#fff", fontWeight: 700 }}>E</span>
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1d1d1f",
            margin: 0,
            letterSpacing: "-0.5px"
          }}>
            EDUTRACK
          </h1>
          <p style={{
            fontSize: 15,
            color: "#86868b",
            marginTop: 8
          }}>
            Gestion scolaire intelligente
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 40 }}>
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 12,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <span style={{ fontSize: 18 }}>!</span>
              <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#1d1d1f",
              marginBottom: 8
            }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "2px solid #e5e5e5",
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e5e5";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#1d1d1f",
              marginBottom: 8
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "2px solid #e5e5e5",
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e5e5";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: loading
                ? "#a5b4fc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 14px 0 rgba(102, 126, 234, 0.4)"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px 0 rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px 0 rgba(102, 126, 234, 0.4)";
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          padding: "20px 40px",
          background: "#f9fafb",
          borderTop: "1px solid #f0f0f0",
          textAlign: "center"
        }}>
          <p style={{ fontSize: 13, color: "#86868b", margin: 0 }}>
            Plateforme sécurisée pour votre établissement
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
