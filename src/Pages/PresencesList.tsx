import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPresences } from "../modules/presences/presence.service";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { PresenceCoursPayload } from "../modules/presences/presence.types";
import type { Eleve } from "../modules/eleves/eleve.types";

interface PresenceDoc extends PresenceCoursPayload { id: string; }

export default function PresencesList() {
  useAuth();
  const { colors } = useTheme();
  const [presences, setPresences] = useState<PresenceDoc[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedPresence, setSelectedPresence] = useState<PresenceDoc | null>(null);

  useEffect(() => {
    Promise.all([getAllPresences(), getAllEleves()]).then(([presenceData, eleveData]) => {
      setPresences(presenceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setEleves(eleveData);
      setLoading(false);
    }).catch((err) => { console.error(err); setLoading(false); });
  }, []);

  // Obtenir le nom de l'eleve par ID
  const getEleveName = (eleveId: string): string => {
    const eleve = eleves.find(e => e.id === eleveId);
    return eleve ? `${eleve.prenom} ${eleve.nom}` : eleveId;
  };

  const getEleveInfo = (eleveId: string): Eleve | undefined => {
    return eleves.find(e => e.id === eleveId);
  };

  const classes = [...new Set(presences.map((p) => p.classe).filter(Boolean))];
  const filtered = presences.filter((p) => {
    const matchClasse = !filterClasse || p.classe === filterClasse;
    const matchDate = !filterDate || p.date === filterDate;
    return matchClasse && matchDate;
  });

  const getStats = (items: PresenceDoc["presences"]) => {
    const presents = items.filter((i) => i.statut === "present").length;
    const absents = items.filter((i) => i.statut === "absent").length;
    const retards = items.filter((i) => i.statut === "retard").length;
    const autorises = items.filter((i) => i.statutMetier === "autorise").length;
    const refuses = items.filter((i) => i.statutMetier === "refuse").length;
    return { presents, absents, retards, autorises, refuses, total: items.length };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.success, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement des presences...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.success }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Presences</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{presences.length} appel{presences.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link to="/presences/appel" style={{ padding: "12px 20px", background: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`, color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Faire l'appel
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} aria-label="Filtrer par classe" style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text, minWidth: 180 }}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          aria-label="Filtrer par date"
          style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text }}
        />
        {(filterClasse || filterDate) && (
          <button
            onClick={() => { setFilterClasse(""); setFilterDate(""); }}
            style={{ padding: "12px 16px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer" }}
          >
            Effacer filtres
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{presences.length === 0 ? "Aucun appel enregistre" : "Aucune presence trouvee"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((presence) => {
            const stats = getStats(presence.presences || []);
            return (
              <div
                key={presence.id}
                onClick={() => setSelectedPresence(presence)}
                style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20, cursor: "pointer", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.bgSecondary, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, fontSize: 12, fontWeight: 600, flexDirection: "column" }}>
                      <span>{new Date(presence.date).getDate()}</span>
                      <span style={{ fontSize: 10 }}>{new Date(presence.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: colors.text, fontSize: 16 }}>{presence.classe}</p>
                      <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>{new Date(presence.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "6px 12px", background: colors.bgSecondary, color: colors.textMuted, borderRadius: 8, fontSize: 13 }}>{stats.total} eleves</span>
                    <span style={{ padding: "6px 12px", background: colors.primaryBg, color: colors.primary, borderRadius: 8, fontSize: 12, fontWeight: 500 }}>Voir details</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 12px", background: colors.successBg, color: colors.success, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{stats.presents} presents</span>
                  <span style={{ padding: "6px 12px", background: colors.dangerBg, color: colors.danger, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{stats.absents} absents</span>
                  {stats.retards > 0 && <span style={{ padding: "6px 12px", background: colors.warningBg, color: colors.warning, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{stats.retards} retards</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Presence */}
      {selectedPresence && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: colors.bgCard,
            borderRadius: 16,
            width: "100%",
            maxWidth: 600,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.text }}>{selectedPresence.classe}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>
                  {new Date(selectedPresence.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setSelectedPresence(null)}
                style={{ width: 36, height: 36, borderRadius: 8, background: colors.bgSecondary, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div style={{ padding: "16px 24px", background: colors.bgSecondary, display: "flex", gap: 16, flexWrap: "wrap" }}>
              {(() => {
                const stats = getStats(selectedPresence.presences || []);
                return (
                  <>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0 }}>{stats.presents}</p>
                      <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>Presents</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 24, fontWeight: 700, color: colors.danger, margin: 0 }}>{stats.absents}</p>
                      <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>Absents</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 24, fontWeight: 700, color: colors.warning, margin: 0 }}>{stats.retards}</p>
                      <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>Retards</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Liste des eleves */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
              {/* Presents */}
              {(selectedPresence.presences || []).filter(p => p.statut === "present").length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.success, margin: "0 0 10px", textTransform: "uppercase" }}>
                    Presents ({(selectedPresence.presences || []).filter(p => p.statut === "present").length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(selectedPresence.presences || []).filter(p => p.statut === "present").map((p) => {
                      const eleve = getEleveInfo(p.eleveId);
                      return (
                        <div key={p.eleveId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: colors.successBg, borderRadius: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: eleve?.sexe === "M" ? "#dbeafe" : "#fce7f3", color: eleve?.sexe === "M" ? "#3b82f6" : "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
                            {eleve?.prenom?.[0] || "?"}
                          </div>
                          <span style={{ fontSize: 14, color: colors.text }}>{getEleveName(p.eleveId)}</span>
                          {p.statutMetier === "refuse" && <span style={{ marginLeft: "auto", fontSize: 11, color: colors.danger, background: colors.dangerBg, padding: "2px 8px", borderRadius: 4 }}>Refuse</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Absents */}
              {(selectedPresence.presences || []).filter(p => p.statut === "absent").length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.danger, margin: "0 0 10px", textTransform: "uppercase" }}>
                    Absents ({(selectedPresence.presences || []).filter(p => p.statut === "absent").length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(selectedPresence.presences || []).filter(p => p.statut === "absent").map((p) => {
                      const eleve = getEleveInfo(p.eleveId);
                      return (
                        <div key={p.eleveId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: colors.dangerBg, borderRadius: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: eleve?.sexe === "M" ? "#dbeafe" : "#fce7f3", color: eleve?.sexe === "M" ? "#3b82f6" : "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
                            {eleve?.prenom?.[0] || "?"}
                          </div>
                          <span style={{ fontSize: 14, color: colors.text }}>{getEleveName(p.eleveId)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Retards */}
              {(selectedPresence.presences || []).filter(p => p.statut === "retard").length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.warning, margin: "0 0 10px", textTransform: "uppercase" }}>
                    Retards ({(selectedPresence.presences || []).filter(p => p.statut === "retard").length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(selectedPresence.presences || []).filter(p => p.statut === "retard").map((p) => {
                      const eleve = getEleveInfo(p.eleveId);
                      return (
                        <div key={p.eleveId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: colors.warningBg, borderRadius: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: eleve?.sexe === "M" ? "#dbeafe" : "#fce7f3", color: eleve?.sexe === "M" ? "#3b82f6" : "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
                            {eleve?.prenom?.[0] || "?"}
                          </div>
                          <span style={{ fontSize: 14, color: colors.text }}>{getEleveName(p.eleveId)}</span>
                          {p.minutesRetard && <span style={{ marginLeft: "auto", fontSize: 11, color: colors.warning }}>{p.minutesRetard} min</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
