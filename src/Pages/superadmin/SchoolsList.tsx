import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";

interface SchoolItem {
  id: string;
  schoolName: string;
  email: string;
  plan: string;
  maxEleves: number;
  totalEleves: number;
  totalUsers: number;
  isActive: boolean;
  createdAt: string | null;
}

export default function SchoolsList() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fn = httpsCallable(functions, "listSchools");
    fn()
      .then((res) => {
        const data = res.data as { success: boolean; schools: SchoolItem[] };
        setSchools(data.schools);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planColors: Record<string, string> = {
    free: colors.textMuted,
    starter: colors.info,
    pro: colors.primary,
    enterprise: colors.warning,
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 24 }}>
        Ecoles ({schools.length})
      </h1>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {schools.map((school) => (
            <div
              key={school.id}
              onClick={() => navigate(`/superadmin/schools/${school.id}`)}
              style={{
                background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12,
                padding: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 2px 8px ${colors.border}`)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 18,
              }}>
                {school.schoolName[0]?.toUpperCase() || "E"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{school.schoolName}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                    background: `${planColors[school.plan] || colors.textMuted}20`,
                    color: planColors[school.plan] || colors.textMuted,
                    textTransform: "uppercase",
                  }}>
                    {school.plan}
                  </span>
                  {!school.isActive && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: colors.dangerBg, color: colors.danger }}>
                      Suspendue
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: "4px 0 0" }}>{school.email}</p>
              </div>

              <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, color: colors.text, margin: 0 }}>{school.totalEleves}</p>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: 11 }}>Eleves</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, color: colors.text, margin: 0 }}>{school.totalUsers}</p>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: 11 }}>Users</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, color: colors.text, margin: 0 }}>{school.maxEleves}</p>
                  <p style={{ color: colors.textMuted, margin: 0, fontSize: 11 }}>Max</p>
                </div>
              </div>
            </div>
          ))}
          {schools.length === 0 && (
            <p style={{ color: colors.textMuted, textAlign: "center", padding: 40 }}>Aucune ecole enregistree.</p>
          )}
        </div>
      )}
    </div>
  );
}
