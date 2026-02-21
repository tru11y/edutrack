import { useState } from "react";
import { useParams } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../services/firebase";

export default function PublicAdmission() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [eleveNom, setEleveNom] = useState("");
  const [elevePrenom, setElevePrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [classe, setClasse] = useState("");
  const [parentNom, setParentNom] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentTelephone, setParentTelephone] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fn = httpsCallable(functions, "createAdmission");
      await fn({ schoolId, eleveNom, elevePrenom, dateNaissance, classe, parentNom, parentEmail, parentTelephone, notes });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la soumission.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 500 as const, color: "#374151", marginBottom: 4 };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafbfc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 8 }}>Candidature soumise</h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            Votre candidature a ete enregistree avec succes. Vous recevrez une reponse par email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520, padding: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", textAlign: "center", marginBottom: 4 }}>
          <span style={{ color: "#6366f1" }}>Edu</span>Track
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 }}>Formulaire d'admission</p>

        {error && (
          <div style={{ padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>Informations de l'eleve</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prenom *</label>
              <input value={elevePrenom} onChange={(e) => setElevePrenom(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nom *</label>
              <input value={eleveNom} onChange={(e) => setEleveNom(e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date de naissance</label>
              <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Classe souhaitee *</label>
              <input value={classe} onChange={(e) => setClasse(e.target.value)} required style={inputStyle} placeholder="Ex: 6eme A" />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: "8px 0 0" }}>Coordonnees du parent</h3>
          <div>
            <label style={labelStyle}>Nom complet *</label>
            <input value={parentNom} onChange={(e) => setParentNom(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Telephone</label>
              <input value={parentTelephone} onChange={(e) => setParentTelephone(e.target.value)} style={inputStyle} placeholder="+221 77 000 00 00" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes supplementaires</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: "12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            cursor: loading ? "wait" : "pointer", fontWeight: 600, fontSize: 14,
          }}>
            {loading ? "Envoi en cours..." : "Soumettre la candidature"}
          </button>
        </form>
      </div>
    </div>
  );
}
