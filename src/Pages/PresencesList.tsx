import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPresences } from "../modules/presences/presence.service";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { exportPresencesExcelSecure } from "../services/cloudFunctions";
import { downloadBase64File } from "../utils/download";
import type { PresenceCoursPayload } from "../modules/presences/presence.types";
import type { Eleve } from "../modules/eleves/eleve.types";
import Modal from "../components/ui/Modal";
import Card from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import { ClassSelect } from "../components/ui/Select";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState, { EmptyStateIcons } from "../components/ui/EmptyState";
import { SkeletonPresenceCard } from "../components/ui/Skeleton";

interface PresenceDoc extends PresenceCoursPayload { id: string; }

export default function PresencesList() {
  useAuth();
  const { colors } = useTheme();
  const [presences, setPresences] = useState<PresenceDoc[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
    return { presents, absents, retards, total: items.length };
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.successBg }} />
            <div>
              <div style={{ width: 150, height: 28, background: colors.bgSecondary, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 100, height: 16, background: colors.bgSecondary, borderRadius: 4 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <SkeletonPresenceCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.success }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Presences</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{presences.length} appel{presences.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setExporting(true);
              try {
                const res = await exportPresencesExcelSecure({ classe: filterClasse || undefined, mois: filterDate ? filterDate.slice(0, 7) : undefined });
                downloadBase64File(res.data, res.filename);
              } catch { /* ignore */ }
              finally { setExporting(false); }
            }}
            disabled={exporting}
            style={{
              padding: "12px 20px", background: colors.bgSecondary, color: colors.textMuted,
              borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
              cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.75 11.25V14.25C15.75 15.08 15.08 15.75 14.25 15.75H3.75C2.92 15.75 2.25 15.08 2.25 14.25V11.25M5.25 7.5L9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {exporting ? "Export..." : "Exporter"}
          </button>
          <Link
            to="/presences/appel"
            style={{
              padding: "12px 20px",
              background: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`,
              color: colors.onGradient,
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Faire l'appel
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <ClassSelect
          value={filterClasse}
          onChange={setFilterClasse}
          classes={classes}
          allLabel="Toutes les classes"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          aria-label="Filtrer par date"
          style={{
            padding: "12px 16px",
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            fontSize: 14,
            background: colors.bgInput,
            color: colors.text,
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        {(filterClasse || filterDate) && (
          <button
            onClick={() => { setFilterClasse(""); setFilterDate(""); }}
            style={{
              padding: "12px 16px",
              background: colors.bgSecondary,
              color: colors.textMuted,
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Effacer filtres
          </button>
        )}
      </div>

      {/* Liste des presences */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={EmptyStateIcons.calendar(colors.textMuted)}
          title={presences.length === 0 ? "Aucun appel enregistre" : "Aucune presence trouvee"}
          description={presences.length === 0
            ? "Commencez par faire l'appel pour enregistrer les presences."
            : "Essayez de modifier vos filtres pour trouver des resultats."}
          action={presences.length === 0 ? (
            <Link
              to="/presences/appel"
              style={{
                padding: "10px 20px",
                background: colors.success,
                color: colors.onGradient,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Faire l'appel
            </Link>
          ) : undefined}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((presence) => {
            const stats = getStats(presence.presences || []);
            return (
              <Card
                key={presence.id}
                onClick={() => setSelectedPresence(presence)}
                hover
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: colors.bgSecondary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.textMuted,
                      fontSize: 12,
                      fontWeight: 600,
                      flexDirection: "column",
                    }}>
                      <span>{new Date(presence.date).getDate()}</span>
                      <span style={{ fontSize: 10 }}>{new Date(presence.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: colors.text, fontSize: 16 }}>{presence.classe}</p>
                      <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
                        {new Date(presence.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusBadge variant="default">{stats.total} eleves</StatusBadge>
                    <StatusBadge variant="primary">Voir details</StatusBadge>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <StatusBadge variant="success">{stats.presents} presents</StatusBadge>
                  <StatusBadge variant="danger">{stats.absents} absents</StatusBadge>
                  {stats.retards > 0 && <StatusBadge variant="warning">{stats.retards} retards</StatusBadge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Detail Presence */}
      <Modal
        isOpen={!!selectedPresence}
        onClose={() => setSelectedPresence(null)}
        title={selectedPresence?.classe || ""}
        subtitle={selectedPresence ? new Date(selectedPresence.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
        size="lg"
      >
        {selectedPresence && (
          <>
            {/* Stats */}
            <div style={{ display: "flex", gap: 24, marginBottom: 24, padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
              {(() => {
                const stats = getStats(selectedPresence.presences || []);
                return (
                  <>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 28, fontWeight: 700, color: colors.success, margin: 0 }}>{stats.presents}</p>
                      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>Presents</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 28, fontWeight: 700, color: colors.danger, margin: 0 }}>{stats.absents}</p>
                      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>Absents</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 28, fontWeight: 700, color: colors.warning, margin: 0 }}>{stats.retards}</p>
                      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>Retards</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Liste des eleves */}
            <div style={{ maxHeight: 400, overflow: "auto" }}>
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
                          <Avatar name={eleve?.prenom} size="sm" variant={eleve?.sexe === "M" ? "male" : "female"} />
                          <span style={{ fontSize: 14, color: colors.text }}>{getEleveName(p.eleveId)}</span>
                          {p.statutMetier === "refuse" && <StatusBadge variant="danger" size="sm">Refuse</StatusBadge>}
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
                          <Avatar name={eleve?.prenom} size="sm" variant={eleve?.sexe === "M" ? "male" : "female"} />
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
                          <Avatar name={eleve?.prenom} size="sm" variant={eleve?.sexe === "M" ? "male" : "female"} />
                          <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>{getEleveName(p.eleveId)}</span>
                          {p.minutesRetard && <span style={{ fontSize: 12, color: colors.warning, fontWeight: 500 }}>{p.minutesRetard} min</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
