import { useEffect, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../services/firebase";
import {
  getCahierTextesAdmin,
  type CahierTexteAdmin,
} from "../../../services/cloudFunctions";
import { useTheme } from "../../../context/ThemeContext";
import { Card, StatCard } from "../../../components/ui/Card";
import Select from "../../../components/ui/Select";

interface Professeur {
  id: string;
  nom: string;
  prenom: string;
}

type ViewMode = "cards" | "list";

export default function AdminCahierList() {
  const { colors } = useTheme();

  const [entries, setEntries] = useState<CahierTexteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedProfId, setSelectedProfId] = useState("");
  const [selectedMois, setSelectedMois] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Options for filters
  const [classes, setClasses] = useState<string[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load classes from eleves
        const elevesSnap = await getDocs(collection(db, "eleves"));
        const classesSet = new Set<string>();
        elevesSnap.docs.forEach((doc) => {
          const classe = doc.data().classe;
          if (classe) classesSet.add(classe);
        });
        setClasses([...classesSet].sort());

        // Load professeurs
        const profsSnap = await getDocs(collection(db, "professeurs"));
        const profs: Professeur[] = profsSnap.docs.map((doc) => ({
          id: doc.id,
          nom: doc.data().nom || "",
          prenom: doc.data().prenom || "",
        }));
        setProfesseurs(profs.sort((a, b) => a.nom.localeCompare(b.nom)));
      } catch (err) {
        console.error("Erreur chargement options:", err);
      }
    };

    loadOptions();
  }, []);

  // Load entries
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { classe?: string; profId?: string; mois?: string } = {};
      if (selectedClasse) params.classe = selectedClasse;
      if (selectedProfId) params.profId = selectedProfId;
      if (selectedMois) params.mois = selectedMois;

      const result = await getCahierTextesAdmin(params);
      setEntries(result.entries);
    } catch (err) {
      setError("Erreur lors du chargement des cahiers de texte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClasse, selectedProfId, selectedMois]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Stats
  const stats = {
    total: entries.length,
    signed: entries.filter((e) => e.isSigned).length,
    unsigned: entries.filter((e) => !e.isSigned).length,
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${colors.border}`,
              borderTopColor: colors.primary,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>
            Chargement des cahiers de texte...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div
          style={{
            background: colors.dangerBg,
            border: `1px solid ${colors.danger}40`,
            borderRadius: 12,
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ color: colors.danger, margin: 0 }}>{error}</p>
          <button
            onClick={loadEntries}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              background: colors.primary,
              color: colors.onGradient,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Reessayer
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
          Cahiers de texte
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: "8px 0 0" }}>
          Consultation des cahiers de texte (lecture seule)
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard label="Total" value={stats.total} color="primary" />
        <StatCard label="Signes" value={stats.signed} color="success" />
        <StatCard label="Non signes" value={stats.unsigned} color="warning" />
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <Select
            value={selectedClasse}
            onChange={setSelectedClasse}
            options={[
              { value: "", label: "Toutes les classes" },
              ...classes.map((c) => ({ value: c, label: c })),
            ]}
            label="Classe"
            placeholder=""
          />

          <Select
            value={selectedProfId}
            onChange={setSelectedProfId}
            options={[
              { value: "", label: "Tous les professeurs" },
              ...professeurs.map((p) => ({
                value: p.id,
                label: `${p.prenom} ${p.nom}`.trim() || p.id,
              })),
            ]}
            label="Professeur"
            placeholder=""
          />

          <Select
            value={selectedMois}
            onChange={setSelectedMois}
            options={[{ value: "", label: "Tous les mois" }, ...monthOptions]}
            label="Mois"
            placeholder=""
          />

          {(selectedClasse || selectedProfId || selectedMois) && (
            <button
              onClick={() => {
                setSelectedClasse("");
                setSelectedProfId("");
                setSelectedMois("");
              }}
              style={{
                padding: "12px 16px",
                background: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                fontSize: 14,
                color: colors.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Reinitialiser
            </button>
          )}

          {/* View mode toggle */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode("cards")}
              title="Vue cartes"
              style={{
                padding: "10px 12px",
                background: viewMode === "cards" ? colors.primaryBg : colors.bgSecondary,
                border: `1px solid ${viewMode === "cards" ? colors.primary : colors.border}`,
                borderRadius: "10px 0 0 10px",
                cursor: "pointer",
                color: viewMode === "cards" ? colors.primary : colors.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Vue liste"
              style={{
                padding: "10px 12px",
                background: viewMode === "list" ? colors.primaryBg : colors.bgSecondary,
                border: `1px solid ${viewMode === "list" ? colors.primary : colors.border}`,
                borderRadius: "0 10px 10px 0",
                cursor: "pointer",
                color: viewMode === "list" ? colors.primary : colors.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {entries.length === 0 ? (
        <Card>
          <div style={{ padding: 40, textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: colors.bgSecondary,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M19.25 3.5H8.75C7.09315 3.5 5.75 4.84315 5.75 6.5V21.5C5.75 23.1569 7.09315 24.5 8.75 24.5H19.25C20.9069 24.5 22.25 23.1569 22.25 21.5V6.5C22.25 4.84315 20.9069 3.5 19.25 3.5Z"
                  stroke={colors.textLight}
                  strokeWidth="2"
                />
                <path
                  d="M10.5 10.5H17.5M10.5 14H17.5M10.5 17.5H14"
                  stroke={colors.textLight}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
              Aucun cahier de texte trouve
            </p>
          </div>
        </Card>
      ) : viewMode === "list" ? (
        /* List View */
        <Card padding="none">
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Classe
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Professeur
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Contenu
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Devoirs
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    style={{
                      background: index % 2 === 0 ? colors.bgCard : colors.bgSecondary,
                      transition: "background 0.15s",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${colors.borderLight}`,
                        color: colors.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(entry.date)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${colors.borderLight}`,
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 10px",
                          background: colors.primaryBg,
                          color: colors.primary,
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {entry.classe}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${colors.borderLight}`,
                        color: colors.text,
                      }}
                    >
                      {entry.profNom || entry.profId}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${colors.borderLight}`,
                        color: entry.contenu ? colors.text : colors.textMuted,
                        maxWidth: 250,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={entry.contenu || "Aucun contenu"}
                    >
                      {entry.contenu || "Aucun contenu"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${colors.borderLight}`,
                        color: entry.devoirs ? colors.warning : colors.textMuted,
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={entry.devoirs || "-"}
                    >
                      {entry.devoirs || "-"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${colors.borderLight}`,
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          background: entry.isSigned ? colors.successBg : colors.warningBg,
                          color: entry.isSigned ? colors.success : colors.warning,
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {entry.isSigned ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M11.67 3.5L5.25 9.92L2.33 7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Signe
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                              <path
                                d="M7 4.08V7L8.75 8.75"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            Attente
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Cards View */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.map((entry) => (
            <Card key={entry.id} padding="none">
              {/* Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${colors.borderLight}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: colors.bgSecondary,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Date box */}
                  <div
                    style={{
                      padding: "8px 14px",
                      background: colors.bgCard,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      textAlign: "center",
                    }}
                  >
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

                  {/* Info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          background: colors.primaryBg,
                          color: colors.primary,
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {entry.classe}
                      </span>
                      {entry.coursId && (
                        <span style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>
                          {entry.coursId}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                      Prof: {entry.profNom || entry.profId}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <div
                  style={{
                    padding: "6px 12px",
                    background: entry.isSigned ? colors.successBg : colors.warningBg,
                    color: entry.isSigned ? colors.success : colors.warning,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {entry.isSigned ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M11.67 3.5L5.25 9.92L2.33 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Signe
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                        <path
                          d="M7 4.08V7L8.75 8.75"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      En attente
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 20 }}>
                {/* Contenu */}
                <div style={{ marginBottom: entry.devoirs ? 16 : 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      color: colors.textLight,
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontWeight: 600,
                    }}
                  >
                    Contenu du cours
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: entry.contenu ? colors.text : colors.textMuted,
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {entry.contenu || "Aucun contenu renseigne"}
                  </p>
                </div>

                {/* Devoirs */}
                {entry.devoirs && (
                  <div
                    style={{
                      padding: 16,
                      background: colors.warningBg,
                      borderRadius: 10,
                      border: `1px solid ${colors.warning}30`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: colors.warning,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M10.5 2.33H3.5C2.85 2.33 2.33 2.85 2.33 3.5V10.5C2.33 11.15 2.85 11.67 3.5 11.67H10.5C11.15 11.67 11.67 11.15 11.67 10.5V3.5C11.67 2.85 11.15 2.33 10.5 2.33Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M4.67 7H9.33M4.67 9.33H7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Devoirs
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        color: colors.text,
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {entry.devoirs}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
