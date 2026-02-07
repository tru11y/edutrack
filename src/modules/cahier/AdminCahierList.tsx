import { useEffect, useState } from "react";
import { getAllCahierEntriesSecure, type CahierEntryAdmin } from "../../services/cloudFunctions";
import { exportCahierToPDF } from "./cahier.export";
import { useTheme } from "../../context/ThemeContext";

export default function AdminCahierList() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<CahierEntryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "signed" | "unsigned">("all");
  const [selectedClasse, setSelectedClasse] = useState("");
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const result = await getAllCahierEntriesSecure();
        setEntries(result.entries);
      } catch (err) {
        setError("Erreur lors du chargement du cahier de texte");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const classes = [...new Set(entries.map((e) => e.classe))].sort();

  const filteredEntries = entries.filter((e) => {
    const matchFilter = filter === "all" ||
      (filter === "signed" && e.isSigned) ||
      (filter === "unsigned" && !e.isSigned);
    const matchClasse = selectedClasse === "" || e.classe === selectedClasse;
    return matchFilter && matchClasse;
  });

  const stats = {
    total: entries.length,
    signed: entries.filter(e => e.isSigned).length,
    unsigned: entries.filter(e => !e.isSigned).length
  };

  const toggleExpanded = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement du cahier de texte...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: colors.dangerBg,
        border: `1px solid ${colors.danger}40`,
        borderRadius: 12,
        padding: 24,
        textAlign: "center"
      }}>
        <p style={{ color: colors.danger, margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Cahier de texte</h1>
          <button
            onClick={() => exportCahierToPDF(filteredEntries, {
              titre: "Cahier de texte - EDUTRACK",
              periode: selectedClasse ? `Classe: ${selectedClasse}` : "Toutes les classes"
            })}
            style={{
              padding: "10px 20px",
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              color: colors.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exporter PDF
          </button>
        </div>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Consultez les cahiers de texte de toutes les classes</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard label="Total entrees" value={stats.total} color={colors.primary} colors={colors} />
        <StatCard label="Signes" value={stats.signed} color={colors.success} colors={colors} />
        <StatCard label="Non signes" value={stats.unsigned} color={colors.warning} colors={colors} />
      </div>

      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <select
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              aria-label="Filtrer par classe"
              style={{
                padding: "10px 36px 10px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 14,
                background: colors.bgInput,
                color: colors.text,
                cursor: "pointer",
                appearance: "none",
              }}
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "all", label: "Tous", count: stats.total, color: colors.primary },
              { value: "signed", label: "Signes", count: stats.signed, color: colors.success },
              { value: "unsigned", label: "Non signes", count: stats.unsigned, color: colors.warning },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                style={{
                  padding: "8px 14px",
                  border: "1px solid",
                  borderColor: filter === f.value ? f.color : colors.border,
                  background: filter === f.value ? f.color + "10" : colors.bgCard,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: filter === f.value ? f.color : colors.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {f.label}
                <span style={{
                  background: filter === f.value ? f.color : colors.bgSecondary,
                  color: filter === f.value ? "#fff" : colors.textMuted,
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
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
              <path d="M19.25 3.5H8.75C7.09315 3.5 5.75 4.84315 5.75 6.5V21.5C5.75 23.1569 7.09315 24.5 8.75 24.5H19.25C20.9069 24.5 22.25 23.1569 22.25 21.5V6.5C22.25 4.84315 20.9069 3.5 19.25 3.5Z" stroke={colors.textMuted} strokeWidth="2"/>
              <path d="M10.5 10.5H17.5M10.5 14H17.5M10.5 17.5H14" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucune entree trouvee</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: colors.bgCard,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: colors.bgSecondary
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    padding: "8px 14px",
                    background: colors.bgCard,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`
                  }}>
                    <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                      {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>
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
                        background: colors.primaryBg,
                        color: colors.primary,
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {entry.classe}
                      </span>
                      <span style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>
                        {entry.coursId}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                      Prof: {entry.profNom || entry.profId} | {entry.elevesDetails.length} eleves presents
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: "6px 12px",
                  background: entry.isSigned ? colors.successBg : colors.warningBg,
                  color: entry.isSigned ? colors.success : colors.warning,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  {entry.isSigned ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11.67 3.5L5.25 9.92L2.33 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Signe
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 4.08V7L8.75 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      En attente
                    </>
                  )}
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    Contenu du cours
                  </p>
                  <p style={{ fontSize: 14, color: colors.text, margin: 0, lineHeight: 1.6 }}>
                    {entry.contenu || "Aucun contenu renseigne"}
                  </p>
                </div>

                {entry.devoirs && (
                  <div style={{
                    padding: 16,
                    background: colors.warningBg,
                    borderRadius: 10,
                    border: `1px solid ${colors.warning}40`,
                    marginBottom: 16
                  }}>
                    <p style={{ fontSize: 12, color: colors.warning, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10.5 2.33H3.5C2.85 2.33 2.33 2.85 2.33 3.5V10.5C2.33 11.15 2.85 11.67 3.5 11.67H10.5C11.15 11.67 11.67 11.15 11.67 10.5V3.5C11.67 2.85 11.15 2.33 10.5 2.33Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M4.67 7H9.33M4.67 9.33H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Devoirs
                    </p>
                    <p style={{ fontSize: 14, color: colors.text, margin: 0, lineHeight: 1.6 }}>
                      {entry.devoirs}
                    </p>
                  </div>
                )}

                <div>
                  <button
                    onClick={() => toggleExpanded(entry.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.text,
                      cursor: "pointer",
                      width: "100%",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 4V8M8 8V12M8 8H12M8 8H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Eleves presents ({entry.elevesDetails.length})
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{
                        transform: expandedEntries.has(entry.id) ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s"
                      }}
                    >
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {expandedEntries.has(entry.id) && (
                    <div style={{
                      marginTop: 12,
                      padding: 16,
                      background: colors.bgSecondary,
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`
                    }}>
                      {entry.elevesDetails.length === 0 ? (
                        <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Aucun eleve enregistre</p>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {entry.elevesDetails.map((eleve) => (
                            <span
                              key={eleve.id}
                              style={{
                                padding: "6px 12px",
                                background: colors.bgCard,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 6,
                                fontSize: 13,
                                color: colors.text
                              }}
                            >
                              {eleve.nomComplet}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, colors }: { label: string; value: number; color: string; colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"] }) {
  return (
    <div style={{
      background: colors.bgCard,
      borderRadius: 16,
      border: `1px solid ${colors.border}`,
      padding: 20
    }}>
      <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}
