import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { signInWithEmailAndPassword } from "firebase/auth";
import { functions, auth } from "../../services/firebase";

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: School info
  const [schoolName, setSchoolName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");

  // Step 2: Admin info
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminNom, setAdminNom] = useState("");
  const [adminPrenom, setAdminPrenom] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const fn = httpsCallable(functions, "createSchool");
      await fn({
        schoolName,
        adminEmail,
        adminPassword,
        adminNom,
        adminPrenom,
        adresse,
        telephone,
      });

      // Auto-login
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la creation.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 500 as const, color: "#374151", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 480, padding: 40 }}>
        <h1 onClick={() => navigate("/landing")} style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px", cursor: "pointer", textAlign: "center" }}>
          <span style={{ color: "#6366f1" }}>Edu</span>Track
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 }}>
          Creez votre ecole en quelques etapes
        </p>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "#6366f1" : "#e5e7eb" }} />
          ))}
        </div>

        {error && (
          <div style={{ padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 20 }}>Votre ecole</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nom de l'ecole *</label>
                <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} style={inputStyle} placeholder="Ex: Ecole Internationale de Dakar" />
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <input value={adresse} onChange={(e) => setAdresse(e.target.value)} style={inputStyle} placeholder="Adresse de l'ecole" />
              </div>
              <div>
                <label style={labelStyle}>Telephone</label>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} placeholder="+221 77 000 00 00" />
              </div>
              <button onClick={() => { if (schoolName.trim()) setStep(2); }} disabled={!schoolName.trim()} style={{
                padding: "12px", background: schoolName.trim() ? "#6366f1" : "#d1d5db", color: "#fff",
                border: "none", borderRadius: 8, cursor: schoolName.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14,
              }}>
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 20 }}>Compte administrateur</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Prenom</label>
                  <input value={adminPrenom} onChange={(e) => setAdminPrenom(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nom</label>
                  <input value={adminNom} onChange={(e) => setAdminNom(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={inputStyle} placeholder="admin@ecole.com" />
              </div>
              <div>
                <label style={labelStyle}>Mot de passe *</label>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={inputStyle} placeholder="6 caracteres minimum" />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
                  Retour
                </button>
                <button onClick={() => { if (adminEmail && adminPassword.length >= 6) setStep(3); }} disabled={!adminEmail || adminPassword.length < 6} style={{
                  flex: 2, padding: "12px", background: (adminEmail && adminPassword.length >= 6) ? "#6366f1" : "#d1d5db",
                  color: "#fff", border: "none", borderRadius: 8, cursor: (adminEmail && adminPassword.length >= 6) ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14,
                }}>
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 20 }}>Confirmation</h2>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                <strong style={{ color: "#111" }}>Ecole:</strong> {schoolName}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                <strong style={{ color: "#111" }}>Admin:</strong> {adminPrenom} {adminNom}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                <strong style={{ color: "#111" }}>Email:</strong> {adminEmail}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                <strong style={{ color: "#111" }}>Plan:</strong> Gratuit (50 eleves max)
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
                Retour
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex: 2, padding: "12px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 8, cursor: loading ? "wait" : "pointer", fontWeight: 600, fontSize: 14,
              }}>
                {loading ? "Creation en cours..." : "Creer mon ecole"}
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 24 }}>
          Deja un compte? <a href="/login" style={{ color: "#6366f1", fontWeight: 500 }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
