import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAllCahiers } from "../cahier/cahier.service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

interface CahierEntry {
  id: string;
  date: string;
  classe: string;
  coursId: string;
  coursNom?: string;
  contenu?: string;
  devoirs?: string;
}

export default function ParentCahier() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [entries, setEntries] = useState<CahierEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadCahiers = async () => {
      // Récupérer les classes des enfants du parent
      const enfantsIds: string[] = (user as unknown as Record<string, unknown>).enfantsIds as string[] || [];
      const classesEnfants = new Set<string>();

      for (const eleveId of enfantsIds) {
        const eleveDoc = await getDoc(doc(db, "eleves", eleveId));
        if (eleveDoc.exists()) {
          const classe = eleveDoc.data().classe;
          if (classe) classesEnfants.add(classe);
        }
      }

      const d = await getAllCahiers();
      const mapped: CahierEntry[] = d
        .filter((item) => classesEnfants.size === 0 || classesEnfants.has(item.classe))
        .map((item) => ({
          id: item.id,
          date: item.date,
          classe: item.classe,
          coursId: item.coursId,
          coursNom: item.profNom,
          contenu: item.contenu,
          devoirs: item.devoirs,
        }));
      const sorted = mapped.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(sorted);
      setLoading(false);
    };
    loadCahiers();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.success,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement du cahier de texte...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>Cahier de texte</h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Contenu des cours et devoirs a faire</p>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 60,
          textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, background: colors.bgSecondary, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M19.25 3.5H8.75C7.09315 3.5 5.75 4.84315 5.75 6.5V21.5C5.75 23.1569 7.09315 24.5 8.75 24.5H19.25C20.9069 24.5 22.25 23.1569 22.25 21.5V6.5C22.25 4.84315 20.9069 3.5 19.25 3.5Z" stroke={colors.textLight} strokeWidth="2"/>
              <path d="M10.5 10.5H17.5M10.5 14H17.5M10.5 17.5H14" stroke={colors.textLight} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun cours publie pour le moment</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: colors.bgCard,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.bgSecondary}`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: colors.bg
              }}>
                <div style={{
                  padding: "8px 14px",
                  background: colors.bgCard,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  textAlign: "center"
                }}>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                    {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>
                    {new Date(entry.date).getDate()}
                  </p>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                    {new Date(entry.date).toLocaleDateString("fr-FR", { month: "short" })}
                  </p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: "4px 10px",
                      background: colors.successBg,
                      color: colors.success,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {entry.classe || "Classe"}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                      {entry.coursNom || entry.coursId || "Cours"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 20 }}>
                {entry.contenu && (
                  <div style={{ marginBottom: entry.devoirs ? 16 : 0 }}>
                    <p style={{
                      fontSize: 12,
                      color: colors.textLight,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontWeight: 600
                    }}>
                      Contenu du cours
                    </p>
                    <p style={{ fontSize: 14, color: colors.text, margin: 0, lineHeight: 1.6 }}>
                      {entry.contenu}
                    </p>
                  </div>
                )}

                {entry.devoirs && (
                  <div style={{
                    padding: 16,
                    background: colors.warningBg,
                    borderRadius: 10,
                    border: `1px solid ${colors.warning}`
                  }}>
                    <p style={{
                      fontSize: 12,
                      color: colors.warning,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10.5 2.33H3.5C2.85 2.33 2.33 2.85 2.33 3.5V10.5C2.33 11.15 2.85 11.67 3.5 11.67H10.5C11.15 11.67 11.67 11.15 11.67 10.5V3.5C11.67 2.85 11.15 2.33 10.5 2.33Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M4.67 7H9.33M4.67 9.33H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Devoirs a faire
                    </p>
                    <p style={{ fontSize: 14, color: colors.warning, margin: 0, lineHeight: 1.6 }}>
                      {entry.devoirs}
                    </p>
                  </div>
                )}

                {!entry.contenu && !entry.devoirs && (
                  <p style={{ fontSize: 14, color: colors.textLight, margin: 0 }}>
                    Aucun contenu renseigne
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
