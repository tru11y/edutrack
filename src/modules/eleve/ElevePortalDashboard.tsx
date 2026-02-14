import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getNotesByEleveSecure, getCloudFunctionErrorMessage, type NoteResult } from "../../services/cloudFunctions";

interface EleveInfo {
  nom: string;
  prenom: string;
  classe: string;
}

export default function ElevePortalDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [eleve, setEleve] = useState<EleveInfo | null>(null);
  const [recentNotes, setRecentNotes] = useState<NoteResult[]>([]);
  const [presenceStats, setPresenceStats] = useState({ present: 0, absent: 0, retard: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.eleveId) loadData();
  }, [user]);

  async function loadData() {
    try {
      const eleveDoc = await getDoc(doc(db, "eleves", user!.eleveId!));
      if (eleveDoc.exists()) {
        const d = eleveDoc.data();
        setEleve({ nom: d.nom, prenom: d.prenom, classe: d.classe });
      }

      // Recent notes
      try {
        const notesRes = await getNotesByEleveSecure({ eleveId: user!.eleveId! });
        setRecentNotes((notesRes.notes || []).slice(0, 5));
      } catch { /* no notes yet */ }

      // Presence stats
      const presSnap = await getDocs(
        query(collection(db, "presences"), where("classe", "!=", ""))
      );
      let present = 0, absent = 0, retard = 0;
      for (const presDoc of presSnap.docs) {
        const appelsSnap = await getDocs(
          query(collection(db, "presences", presDoc.id, "appels"), where("eleveId", "==", user!.eleveId!))
        );
        for (const appel of appelsSnap.docs) {
          const s = appel.data().statut;
          if (s === "present") present++;
          else if (s === "absent") absent++;
          else if (s === "retard") retard++;
        }
      }
      setPresenceStats({ present, absent, retard });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>;
  }

  const total = presenceStats.present + presenceStats.absent + presenceStats.retard;
  const tauxPresence = total > 0 ? Math.round(((presenceStats.present + presenceStats.retard) / total) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
          Bonjour, {eleve?.prenom || "Eleve"} !
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
          {eleve?.classe} — Bienvenue sur votre espace
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.success }}>{tauxPresence}%</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Taux de presence</div>
        </div>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.primary }}>{presenceStats.present}</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Presences</div>
        </div>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.danger }}>{presenceStats.absent}</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Absences</div>
        </div>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.warning }}>{presenceStats.retard}</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>Retards</div>
        </div>
      </div>

      {/* Recent notes */}
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>Notes recentes</h2>
          <Link to="/eleve/notes" style={{ fontSize: 13, color: colors.primary, textDecoration: "none" }}>Voir tout</Link>
        </div>
        {recentNotes.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 13 }}>Aucune note disponible.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentNotes.map((n) => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{n.evaluation?.titre}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{n.evaluation?.matiere}</span>
                </div>
                <span style={{
                  fontWeight: 600, fontSize: 14,
                  color: n.absence ? colors.danger : (n.note / (n.evaluation?.maxNote || 20)) >= 0.5 ? colors.success : colors.danger,
                }}>
                  {n.absence ? "Absent" : `${n.note}/${n.evaluation?.maxNote}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Link to="/eleve/notes" style={{
          padding: 16, background: colors.primaryBg, border: `1px solid ${colors.primary}30`,
          borderRadius: 12, textDecoration: "none", color: colors.primary, fontWeight: 500, fontSize: 14,
        }}>
          Mes notes
        </Link>
        <Link to="/eleve/presences" style={{
          padding: 16, background: colors.successBg, border: `1px solid ${colors.success}30`,
          borderRadius: 12, textDecoration: "none", color: colors.success, fontWeight: 500, fontSize: 14,
        }}>
          Mes presences
        </Link>
        <Link to="/eleve/emploi-du-temps" style={{
          padding: 16, background: colors.infoBg, border: `1px solid ${colors.info}30`,
          borderRadius: 12, textDecoration: "none", color: colors.info, fontWeight: 500, fontSize: 14,
        }}>
          Emploi du temps
        </Link>
        <Link to="/eleve/bulletins" style={{
          padding: 16, background: colors.warningBg, border: `1px solid ${colors.warning}30`,
          borderRadius: 12, textDecoration: "none", color: colors.warning, fontWeight: 500, fontSize: 14,
        }}>
          Mes bulletins
        </Link>
      </div>
    </div>
  );
}
