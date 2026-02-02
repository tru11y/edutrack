import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { Eleve } from "../modules/eleves/eleve.types";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import { ClassSelect } from "../components/ui/Select";
import EmptyState, { EmptyStateIcons } from "../components/ui/EmptyState";
import { SkeletonStudentCard } from "../components/ui/Skeleton";
import StatusBadge from "../components/ui/StatusBadge";

export default function MesEleves() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");
  const [myClasses, setMyClasses] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMyClasses(userData.classesEnseignees || []);
          }
        }

        const data = await getAllEleves();
        setEleves(data.filter((e) => e.statut === "actif"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const myEleves = myClasses.length > 0
    ? eleves.filter((e) => myClasses.includes(e.classe))
    : eleves;

  const classes = [...new Set(myEleves.map((e) => e.classe).filter(Boolean))];
  const filteredEleves = myEleves.filter((e) => !filterClasse || e.classe === filterClasse);

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonStudentCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.success }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.34 15.66 16 14 16H6C4.34 16 3 17.34 3 19V21M21 21V19C21 17.79 20.21 16.76 19.12 16.42M15.62 3.58C16.7 3.93 17.49 4.96 17.49 6.16C17.49 7.36 16.7 8.39 15.62 8.74M12 9C12 10.66 10.66 12 9 12C7.34 12 6 10.66 6 9C6 7.34 7.34 6 9 6C10.66 6 12 7.34 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Mes eleves</h1>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
              {filteredEleves.length} eleve{filteredEleves.length > 1 ? "s" : ""}
              {myClasses.length > 0 && ` - ${myClasses.length} classe(s)`}
            </p>
          </div>
        </div>
      </div>

      {/* Mes classes badges */}
      {myClasses.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>Mes classes</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {myClasses.map((c) => (
              <StatusBadge key={c} variant="primary">{c}</StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* Warning si pas de classes */}
      {myClasses.length === 0 && (
        <div style={{ padding: 16, background: colors.warningBg, borderRadius: 12, marginBottom: 24, border: `1px solid ${colors.warning}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ margin: 0, fontSize: 14, color: colors.warning }}>
              Aucune classe ne vous a ete attribuee. Contactez un administrateur pour etre affecte a des classes.
            </p>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div style={{ marginBottom: 24 }}>
        <ClassSelect
          value={filterClasse}
          onChange={setFilterClasse}
          classes={classes}
          allLabel="Toutes mes classes"
        />
      </div>

      {/* Liste des eleves */}
      {filteredEleves.length === 0 ? (
        <EmptyState
          icon={EmptyStateIcons.users(colors.textMuted)}
          title="Aucun eleve"
          description={myClasses.length === 0
            ? "Vous n'avez pas encore de classes attribuees."
            : "Aucun eleve trouve dans vos classes."}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {filteredEleves.map((eleve) => (
            <Card
              key={eleve.id}
              hover
              style={{ textAlign: "center" }}
            >
              <Avatar
                name={eleve.prenom}
                size="lg"
                variant={eleve.sexe === "M" ? "male" : "female"}
              />
              <p style={{ margin: "12px 0 4px", fontWeight: 600, color: colors.text, fontSize: 16 }}>
                {eleve.prenom}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
                {eleve.classe}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
