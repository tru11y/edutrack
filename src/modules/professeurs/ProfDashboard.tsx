import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getProfesseurById } from "./professeur.service";
import { getCoursByProfesseur } from "../cours/cours.service";
import { CircularProgress, LineChart } from "../../components/charts";
import type { Professeur } from "./professeur.types";
import type { Cours } from "../cours/cours.types";

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [prof, setProf] = useState<Professeur | null>(null);
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [presenceStats, setPresenceStats] = useState({ present: 0, absent: 0, retard: 0, taux: 0 });
  const [noteTrends, setNoteTrends] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

  useEffect(() => {
    const load = async () => {
      if (!user || !user.professeurId) return;

      const p = await getProfesseurById(user.professeurId);
      if (!p || !p.id) {
        setLoading(false);
        return;
      }
      const c = await getCoursByProfesseur(p.id);
      setProf(p);
      setCours(c);

      // Fetch presence stats for prof's courses
      try {
        const coursIds = c.map((co) => co.id).filter(Boolean);
        if (coursIds.length > 0) {
          let present = 0, absent = 0, retard = 0;
          for (const coursId of coursIds) {
            const presSnap = await getDocs(query(collection(db, "presences"), where("coursId", "==", coursId)));
            presSnap.forEach((d) => {
              const statut = d.data().statut;
              if (statut === "present") present++;
              else if (statut === "absent") absent++;
              else if (statut === "retard") retard++;
            });
          }
          const total = present + absent + retard;
          setPresenceStats({ present, absent, retard, taux: total > 0 ? Math.round((present / total) * 100) : 0 });
        }
      } catch { /* ignore */ }

      // Fetch notes trend (last 6 evaluations)
      try {
        const evalSnap = await getDocs(query(collection(db, "evaluations"), where("professeurId", "==", user.uid)));
        const evals = evalSnap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(-6);
        const labels: string[] = [];
        const data: number[] = [];
        for (const ev of evals) {
          const notesSnap = await getDocs(query(collection(db, "notes"), where("evaluationId", "==", ev.id)));
          const notes = notesSnap.docs.map((d) => d.data().note as number);
          if (notes.length > 0) {
            labels.push((ev as Record<string, string>).titre?.slice(0, 8) || ev.id.slice(0, 6));
            data.push(Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 100) / 100);
          }
        }
        setNoteTrends({ labels, data });
      } catch { /* ignore */ }

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) return <div className="p-6" style={{ color: colors.textMuted }}>Chargement…</div>;
  if (!prof) return <div className="p-6" style={{ color: colors.danger }}>Profil professeur introuvable</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 24, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Bonjour {prof.prenom} {prof.nom}
      </h1>

      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginBottom: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 16 }}>Taux de presence</h3>
          <CircularProgress
            percentage={presenceStats.taux}
            color={presenceStats.taux >= 80 ? colors.success : presenceStats.taux >= 60 ? colors.warning : colors.danger}
            sublabel={`${presenceStats.present} presents, ${presenceStats.absent} absents`}
          />
        </div>

        {noteTrends.labels.length > 0 && (
          <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 16 }}>Evolution des notes</h3>
            <LineChart
              labels={noteTrends.labels}
              datasets={[{ label: "Moyenne", data: noteTrends.data, color: colors.primary }]}
              height={180}
              width={350}
            />
          </div>
        )}
      </div>

      {/* Cours List */}
      {cours.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Aucun cours assigne</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {cours.map((c) => (
            <div
              key={c.id}
              style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 16 }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.matiere} — {c.classe}
              </h2>
              <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
                {c.date} | {c.heureDebut} - {c.heureFin}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/prof/cours/${c.id}`} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13, background: colors.text, color: colors.bg, textDecoration: "none" }}>
                  Appel
                </Link>
                <Link to={`/prof/cours/${c.id}?tab=cahier`} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13, background: colors.primary, color: colors.onGradient, textDecoration: "none" }}>
                  Cahier
                </Link>
                <Link to={`/prof/cours/${c.id}?tab=exclusion`} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13, background: colors.danger, color: colors.onGradient, textDecoration: "none" }}>
                  Exclure
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
