import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { JOURS } from "../constants";

interface TodayCreneau {
  heureDebut: string;
  heureFin: string;
  matiere: string;
  classe: string;
  salle?: string;
}

interface RecentEval {
  id: string;
  titre: string;
  matiere: string;
  classe: string;
  date: string;
}

export default function ProfDashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState<string[]>([]);
  const [todayCourses, setTodayCourses] = useState<TodayCreneau[]>([]);
  const [recentEvals, setRecentEvals] = useState<RecentEval[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const classes: string[] = userData?.classesEnseignees || [];
        setMyClasses(classes);

        const days = ["dimanche", ...JOURS];
        const today = days[new Date().getDay()] || "lundi";
        const scheduleSnap = await getDocs(
          query(collection(db, "emploi_du_temps"), where("professeurId", "==", user.uid), where("jour", "==", today))
        );
        const creneaux = scheduleSnap.docs.map((d) => d.data() as TodayCreneau).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        setTodayCourses(creneaux);

        const evalsSnap = await getDocs(
          query(collection(db, "evaluations"), where("professeurId", "==", user.uid), orderBy("createdAt", "desc"), limit(5))
        );
        setRecentEvals(evalsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RecentEval)));

        if (classes.length > 0) {
          const elevesSnap = await getDocs(collection(db, "eleves"));
          const count = elevesSnap.docs.filter((d) => classes.includes(d.data().classe) && d.data().statut === "actif").length;
          setStudentsCount(count);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const cardStyle = {
    background: colors.bgCard,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 20,
  };

  if (loading) return <div style={{ padding: 32, color: colors.text }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>Bonjour, {user?.prenom || "Professeur"}</h1>
      <p style={{ color: colors.textMuted, margin: "0 0 24px", fontSize: 14 }}>
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 4px" }}>Mes classes</p>
          <p style={{ color: colors.text, fontSize: 28, fontWeight: 700, margin: 0 }}>{myClasses.length}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 4px" }}>Mes eleves</p>
          <p style={{ color: colors.text, fontSize: 28, fontWeight: 700, margin: 0 }}>{studentsCount}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 4px" }}>Cours aujourd'hui</p>
          <p style={{ color: colors.text, fontSize: 28, fontWeight: 700, margin: 0 }}>{todayCourses.length}</p>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Emploi du temps du jour</h2>
      {todayCourses.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 32, marginBottom: 24 }}>
          <p style={{ color: colors.textMuted, margin: 0 }}>Pas de cours aujourd'hui</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {todayCourses.map((c, i) => (
            <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                padding: "8px 14px", borderRadius: 8,
                background: `${colors.success}15`, color: colors.success,
                fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
              }}>
                {c.heureDebut} - {c.heureFin}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>{c.matiere}</p>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{c.classe}{c.salle ? ` - ${c.salle}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentEvals.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Evaluations recentes</h2>
          <div style={{ ...cardStyle, overflow: "hidden", padding: 0, marginBottom: 24 }}>
            {recentEvals.map((e, i) => (
              <div
                key={e.id}
                onClick={() => navigate(`/evaluations/${e.id}/notes`)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 20px", cursor: "pointer",
                  borderTop: i > 0 ? `1px solid ${colors.borderLight}` : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>{e.titre}</p>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{e.matiere} - {e.classe}</p>
                </div>
                <span style={{ fontSize: 12, color: colors.textMuted }}>{e.date}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Actions rapides</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { label: "Faire l'appel", path: "/presences/appel", color: "#10b981" },
          { label: "Cahier de texte", path: "/cahier/nouveau", color: "#3b82f6" },
          { label: "Nouvelle evaluation", path: "/evaluations/nouvelle", color: "#8b5cf6" },
          { label: "Mes eleves", path: "/mes-eleves", color: "#f59e0b" },
        ].map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            style={{
              ...cardStyle, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
              background: `${a.color}10`,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: a.color }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
