import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

interface Stats {
  totalEleves: number;
  presentAujourdhui: number;
  totalPaiementsEnCours: number;
  paiementsRecents: { eleveNom: string; montantPaye: number; mois: string }[];
}

export default function SoirDashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const [stats, setStats] = useState<Stats>({
    totalEleves: 0,
    presentAujourdhui: 0,
    totalPaiementsEnCours: 0,
    paiementsRecents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const elevesQ = schoolId
          ? query(collection(db, "eleves"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
          : query(collection(db, "eleves"), where("programme", "==", "soir"));

        const presencesQ = schoolId
          ? query(collection(db, "presences"), where("schoolId", "==", schoolId), where("programme", "==", "soir"), where("date", "==", today))
          : query(collection(db, "presences"), where("programme", "==", "soir"), where("date", "==", today));

        const paiementsQ = schoolId
          ? query(collection(db, "paiements"), where("schoolId", "==", schoolId), where("programme", "==", "soir"), where("statut", "!=", "paye"))
          : query(collection(db, "paiements"), where("programme", "==", "soir"), where("statut", "!=", "paye"));

        const [elevesSnap, presencesSnap, paiementsSnap] = await Promise.all([
          getDocs(elevesQ),
          getDocs(presencesQ),
          getDocs(paiementsQ),
        ]);

        // Recent paid payments
        const paiementsRecentsQ = schoolId
          ? query(collection(db, "paiements"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
          : query(collection(db, "paiements"), where("programme", "==", "soir"));
        const recentsSnap = await getDocs(paiementsRecentsQ);
        const recents = recentsSnap.docs
          .map((d) => d.data())
          .sort((a, b) => {
            const ta = a.datePaiement?.seconds || 0;
            const tb = b.datePaiement?.seconds || 0;
            return tb - ta;
          })
          .slice(0, 5)
          .map((d) => ({
            eleveNom: d.eleveNom || "—",
            montantPaye: d.montantPaye || 0,
            mois: d.mois || "—",
          }));

        let presentCount = 0;
        presencesSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.statut === "present" || data.present === true) presentCount++;
          if (Array.isArray(data.presences)) {
            presentCount += data.presences.filter((p: { statut: string }) => p.statut === "present").length;
          }
        });

        setStats({
          totalEleves: elevesSnap.size,
          presentAujourdhui: presentCount,
          totalPaiementsEnCours: paiementsSnap.size,
          paiementsRecents: recents,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId, user?.uid]);

  const cardStyle = {
    background: colors.bgCard,
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    padding: 24,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          Cours du soir
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
          Tableau de bord — Programme d'enseignement du soir
        </p>
      </div>

      {loading ? (
        <p style={{ color: colors.textMuted }}>Chargement…</p>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Élèves inscrits", value: stats.totalEleves, color: colors.primary, icon: "👥" },
              { label: "Présents aujourd'hui", value: stats.presentAujourdhui, color: colors.success, icon: "✅" },
              { label: "Paiements en cours", value: stats.totalPaiementsEnCours, color: colors.warning, icon: "💰" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ ...cardStyle, borderTop: `3px solid ${kpi.color}` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: colors.text }}>{kpi.value}</div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[
              { to: "/cours-du-soir/eleves/nouveau", label: "Ajouter un élève", color: colors.primary },
              { to: "/cours-du-soir/presences/appel", label: "Faire l'appel", color: colors.success },
              { to: "/cours-du-soir/paiements/nouveau", label: "Enregistrer un paiement", color: colors.warning },
              { to: "/cours-du-soir/emploi-du-temps", label: "Emploi du temps", color: colors.info },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: "14px 18px",
                  background: `${link.color}12`,
                  border: `1px solid ${link.color}30`,
                  borderRadius: 10,
                  color: link.color,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  display: "block",
                  transition: "background 0.15s",
                }}
              >
                {link.label} →
              </Link>
            ))}
          </div>

          {/* Recent payments */}
          {stats.paiementsRecents.length > 0 && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>
                Paiements récents
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.paiementsRecents.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < stats.paiementsRecents.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                    <span style={{ fontSize: 14, color: colors.text }}>{p.eleveNom}</span>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>{p.mois}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.success }}>
                      {p.montantPaye.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
