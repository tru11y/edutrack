import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

interface SchoolData {
  schoolName: string;
  email: string;
  adresse: string;
  telephone: string;
  anneeScolaire: string;
  plan: string;
  isActive: boolean;
  createdAt: unknown;
}

export default function SchoolDetail() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    getDoc(doc(db, "schools", schoolId))
      .then((snap) => {
        if (snap.exists()) setSchool(snap.data() as SchoolData);
      })
      .finally(() => setLoading(false));
  }, [schoolId]);

  const toggleActive = async () => {
    if (!schoolId || !school) return;
    const newActive = !school.isActive;
    await updateDoc(doc(db, "schools", schoolId), { isActive: newActive });
    setSchool({ ...school, isActive: newActive });
  };

  if (loading) return <p style={{ color: colors.textMuted }}>Chargement...</p>;
  if (!school) return <p style={{ color: colors.danger }}>Ecole non trouvee.</p>;

  return (
    <div>
      <button onClick={() => navigate("/superadmin/schools")} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 }}>
        ← Retour aux ecoles
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 24,
        }}>
          {school.schoolName[0]?.toUpperCase() || "E"}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>{school.schoolName}</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>{school.email}</p>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8, marginLeft: 8,
          background: school.isActive ? colors.successBg : colors.dangerBg,
          color: school.isActive ? colors.success : colors.danger,
        }}>
          {school.isActive ? "Active" : "Suspendue"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 12 }}>Informations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: colors.textMuted }}>Adresse:</span> <span style={{ color: colors.text }}>{school.adresse || "—"}</span></div>
            <div><span style={{ color: colors.textMuted }}>Telephone:</span> <span style={{ color: colors.text }}>{school.telephone || "—"}</span></div>
            <div><span style={{ color: colors.textMuted }}>Annee scolaire:</span> <span style={{ color: colors.text }}>{school.anneeScolaire || "—"}</span></div>
            <div><span style={{ color: colors.textMuted }}>Plan:</span> <span style={{ color: colors.text, textTransform: "capitalize" }}>{school.plan || "free"}</span></div>
          </div>
        </div>

        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 12 }}>Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={toggleActive} style={{
              padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13,
              background: school.isActive ? colors.dangerBg : colors.successBg,
              color: school.isActive ? colors.danger : colors.success,
            }}>
              {school.isActive ? "Suspendre l'ecole" : "Reactiver l'ecole"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
