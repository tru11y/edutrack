import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface EleveInfo {
  nom: string;
  prenom: string;
  classe: string;
  isBanned: boolean;
}

interface Stats {
  presences: number;
  absences: number;
  retards: number;
  tauxPresence: number;
  montantDu: number;
}

export default function EleveDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [eleve, setEleve] = useState<EleveInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.eleveId) {
        setLoading(false);
        return;
      }

      try {
        // Info élève
        const eleveDoc = await getDoc(doc(db, "eleves", user.eleveId));
        if (eleveDoc.exists()) {
          setEleve(eleveDoc.data() as EleveInfo);
        }

        // Présences
        const presencesSnap = await getDocs(collection(db, "presences"));
        let presences = 0, absences = 0, retards = 0;

        presencesSnap.docs.forEach(d => {
          const data = d.data();
          const mine = data.presences?.find((p: { eleveId: string }) => p.eleveId === user.eleveId);
          if (mine) {
            if (mine.statut === "present") presences++;
            else if (mine.statut === "absent") absences++;
            else if (mine.statut === "retard") retards++;
          }
        });

        const total = presences + absences + retards;
        const tauxPresence = total > 0 ? Math.round(((presences + retards) / total) * 100) : 100;

        // Paiements
        const paiementsSnap = await getDocs(
          query(collection(db, "paiements"), where("eleveId", "==", user.eleveId))
        );

        const montantDu = paiementsSnap.docs.reduce((acc, d) => {
          const data = d.data();
          return acc + ((data.montantTotal || 0) - (data.montantPaye || 0));
        }, 0);

        setStats({ presences, absences, retards, tauxPresence, montantDu });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <p style={{ color: colors.textMuted }}>Chargement...</p>
      </div>
    );
  }

  if (eleve?.isBanned) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: colors.dangerBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Compte suspendu</h2>
          <p style={{ fontSize: 14, color: colors.textMuted }}>
            Votre compte a été suspendu en raison d'impayés. Veuillez régulariser votre situation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
          Bonjour {eleve?.prenom || ""}
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted }}>
          {eleve?.classe && `Classe de ${eleve.classe}`} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Taux présence</p>
          <p style={{
            fontSize: 32,
            fontWeight: 600,
            color: (stats?.tauxPresence || 0) >= 80 ? colors.success : (stats?.tauxPresence || 0) >= 60 ? colors.warning : colors.danger
          }}>
            {stats?.tauxPresence || 0}%
          </p>
        </div>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Présences</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: colors.success }}>{stats?.presences || 0}</p>
        </div>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Absences</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: colors.danger }}>{stats?.absences || 0}</p>
        </div>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Retards</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: colors.warning }}>{stats?.retards || 0}</p>
        </div>
      </div>

      {/* Paiement */}
      {stats && stats.montantDu > 0 && (
        <div style={{
          background: colors.warningBg,
          border: `1px solid ${colors.warning}40`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: colors.warning, marginBottom: 4 }}>Paiement en attente</p>
            <p style={{ fontSize: 13, color: colors.warning }}>Veuillez régulariser votre situation</p>
          </div>
          <p style={{ fontSize: 20, fontWeight: 600, color: colors.warning }}>
            {stats.montantDu.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      )}

      {/* Liens */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <QuickLink to="/eleve/presences" label="Mes présences" desc="Historique détaillé" colors={colors} />
        <QuickLink to="/eleve/emploi-du-temps" label="Emploi du temps" desc="Planning de la semaine" colors={colors} />
        <QuickLink to="/eleve/paiements" label="Mes paiements" desc="Historique et reçus" colors={colors} />
      </div>
    </div>
  );
}

function QuickLink({ to, label, desc, colors }: { to: string; label: string; desc: string; colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"] }) {
  return (
    <Link to={to} style={{
      background: colors.bgCard,
      borderRadius: 16,
      border: `1px solid ${colors.border}`,
      padding: 20,
      textDecoration: "none"
    }}>
      <p style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, color: colors.textMuted }}>{desc}</p>
    </Link>
  );
}
