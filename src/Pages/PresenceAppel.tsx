import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { savePresencesForCours } from "../modules/presences/presence.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/ui";
import type { Eleve } from "../modules/eleves/eleve.types";
import type { PresenceItem, StatutMetier } from "../modules/presences/presence.types";

type PresenceStatut = "present" | "absent" | "retard";

interface ElevePresence {
  eleveId: string;
  eleve: Eleve;
  statut: PresenceStatut;
  statutMetier: StatutMetier;
  minutesRetard?: number;
}

export default function PresenceAppel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const isProf = user?.role === "prof";
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classe, setClasse] = useState("");
  const [presences, setPresences] = useState<ElevePresence[]>([]);

  useEffect(() => {
    getAllEleves()
      .then((data) => {
        setEleves(data.filter((e) => e.statut === "actif"));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))];

  useEffect(() => {
    if (classe) {
      setPresences(
        eleves
          .filter((e) => e.classe === classe)
          .map((e) => ({
            eleveId: e.id!,
            eleve: e,
            statut: "present",
            statutMetier: "autorise",
          }))
      );
    } else {
      setPresences([]);
    }
  }, [classe, eleves]);

  const updateStatut = (eleveId: string, statut: PresenceStatut) => {
    setPresences((prev) =>
      prev.map((p) =>
        p.eleveId === eleveId
          ? { ...p, statut, minutesRetard: statut === "retard" ? 5 : undefined }
          : p
      )
    );
  };

  const updateStatutMetier = (eleveId: string, statutMetier: StatutMetier) => {
    setPresences((prev) =>
      prev.map((p) => (p.eleveId === eleveId ? { ...p, statutMetier } : p))
    );
  };

  const handleSubmit = async () => {
    if (!classe || !date || presences.length === 0) {
      toast.warning("Veuillez selectionner une classe");
      return;
    }
    try {
      setSaving(true);
      const presenceItems: PresenceItem[] = presences.map((p) => {
        const item: PresenceItem = {
          eleveId: p.eleveId,
          statut: p.statut,
          facturable: p.statut !== "absent",
          statutMetier: p.statutMetier,
          message: "",
        };
        if (p.statut === "retard" && p.minutesRetard) {
          item.minutesRetard = p.minutesRetard;
        }
        return item;
      });
      await savePresencesForCours({
        coursId: `appel-${date}-${classe}`,
        classe,
        date,
        presences: presenceItems,
      });
      navigate("/presences");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    presents: presences.filter((p) => p.statut === "present").length,
    absents: presences.filter((p) => p.statut === "absent").length,
    retards: presences.filter((p) => p.statut === "retard").length,
    autorises: presences.filter((p) => p.statutMetier === "autorise").length,
    refuses: presences.filter((p) => p.statutMetier === "refuse").length,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.success, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/presences" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Faire l'appel</h1>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Classe</label>
            <select
              value={classe}
              onChange={(e) => setClasse(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box" }}
            >
              <option value="">Selectionner</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {classe && presences.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          <div style={{ background: colors.successBg, borderRadius: 12, padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0 }}>{stats.presents}</p>
            <p style={{ fontSize: 12, color: colors.success, margin: "4px 0 0" }}>Presents</p>
          </div>
          <div style={{ background: colors.dangerBg, borderRadius: 12, padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.danger, margin: 0 }}>{stats.absents}</p>
            <p style={{ fontSize: 12, color: colors.danger, margin: "4px 0 0" }}>Absents</p>
          </div>
          <div style={{ background: colors.warningBg, borderRadius: 12, padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.warning, margin: 0 }}>{stats.retards}</p>
            <p style={{ fontSize: 12, color: colors.warning, margin: "4px 0 0" }}>Retards</p>
          </div>
          <div style={{ background: colors.successBg, borderRadius: 12, padding: 16, textAlign: "center", border: `2px solid ${colors.success}` }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.success, margin: 0 }}>{stats.autorises}</p>
            <p style={{ fontSize: 12, color: colors.success, margin: "4px 0 0" }}>Autorises</p>
          </div>
          <div style={{ background: colors.dangerBg, borderRadius: 12, padding: 16, textAlign: "center", border: `2px solid ${colors.danger}` }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: colors.danger, margin: 0 }}>{stats.refuses}</p>
            <p style={{ fontSize: 12, color: colors.danger, margin: "4px 0 0" }}>Refuses</p>
          </div>
        </div>
      )}

      {classe && presences.length > 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
            <p style={{ margin: 0, fontWeight: 600, color: colors.text }}>{presences.length} eleve{presences.length > 1 ? "s" : ""}</p>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {presences.map((p) => (
              <div key={p.eleveId} style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Point vert/rouge pour autorise/refuse */}
                  <button
                    type="button"
                    onClick={() => updateStatutMetier(p.eleveId, p.statutMetier === "autorise" ? "refuse" : "autorise")}
                    title={p.statutMetier === "autorise" ? "Autorise (cliquez pour refuser)" : "Refuse (cliquez pour autoriser)"}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: p.statutMetier === "autorise" ? colors.success : colors.danger,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: `0 0 0 3px ${p.statutMetier === "autorise" ? `${colors.success}30` : `${colors.danger}30`}`,
                      transition: "all 0.2s"
                    }}
                  />
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: p.eleve.sexe === "M" ? colors.infoBg : colors.femaleBg,
                    color: p.eleve.sexe === "M" ? colors.info : colors.femaleText,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14
                  }}>
                    {p.eleve.prenom[0]}{!isProf && p.eleve.nom[0]}
                  </div>
                  <p style={{ margin: 0, fontWeight: 500, color: colors.text }}>
                    {isProf ? p.eleve.prenom : `${p.eleve.prenom} ${p.eleve.nom}`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => updateStatut(p.eleveId, "present")}
                    style={{
                      padding: "8px 16px",
                      background: p.statut === "present" ? colors.success : colors.bgSecondary,
                      color: p.statut === "present" ? colors.onGradient : colors.textMuted,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatut(p.eleveId, "absent")}
                    style={{
                      padding: "8px 16px",
                      background: p.statut === "absent" ? colors.danger : colors.bgSecondary,
                      color: p.statut === "absent" ? colors.onGradient : colors.textMuted,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatut(p.eleveId, "retard")}
                    style={{
                      padding: "8px 16px",
                      background: p.statut === "retard" ? colors.warning : colors.bgSecondary,
                      color: p.statut === "retard" ? colors.onGradient : colors.textMuted,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Retard
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`,
                color: colors.onGradient,
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer l'appel"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{classe ? "Aucun eleve actif" : "Selectionnez une classe"}</p>
        </div>
      )}
    </div>
  );
}
