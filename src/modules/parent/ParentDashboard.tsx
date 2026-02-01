import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface Enfant {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  isBanned: boolean;
  presences: number;
  absences: number;
  retards: number;
  tauxPresence: number;
  montantDu: number;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.enfantsIds || user.enfantsIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results: Enfant[] = [];

        for (const enfantId of user.enfantsIds) {
          const enfantDoc = await getDoc(doc(db, "eleves", enfantId));
          if (!enfantDoc.exists()) continue;

          const data = enfantDoc.data();

          // Présences
          const presencesSnap = await getDocs(collection(db, "presences"));
          let presences = 0, absences = 0, retards = 0;

          presencesSnap.docs.forEach(d => {
            const pData = d.data();
            const mine = pData.presences?.find((p: { eleveId: string }) => p.eleveId === enfantId);
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
            query(collection(db, "paiements"), where("eleveId", "==", enfantId))
          );

          const montantDu = paiementsSnap.docs.reduce((acc, d) => {
            const pData = d.data();
            return acc + ((pData.montantTotal || 0) - (pData.montantPaye || 0));
          }, 0);

          results.push({
            id: enfantId,
            nom: data.nom,
            prenom: data.prenom,
            classe: data.classe,
            isBanned: data.isBanned || false,
            presences,
            absences,
            retards,
            tauxPresence,
            montantDu
          });
        }

        setEnfants(results);
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

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
          Espace Parent
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted }}>
          Suivez la scolarité de {enfants.length === 1 ? "votre enfant" : "vos enfants"}
        </p>
      </div>

      {enfants.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 40,
          textAlign: "center"
        }}>
          <p style={{ fontSize: 15, color: colors.textMuted }}>
            Aucun enfant associé à votre compte. Contactez l'administration.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {enfants.map((enfant) => (
            <div key={enfant.id} style={{
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              overflow: "hidden"
            }}>
              {/* Header enfant */}
              <div style={{
                padding: 20,
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: enfant.isBanned ? colors.danger : colors.info,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 600
                  }}>
                    {enfant.prenom[0]}{enfant.nom[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                      {enfant.prenom} {enfant.nom}
                    </p>
                    <p style={{ fontSize: 13, color: colors.textMuted }}>Classe de {enfant.classe}</p>
                  </div>
                </div>
                {enfant.isBanned && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: colors.dangerBg,
                    color: colors.danger
                  }}>
                    Suspendu
                  </span>
                )}
              </div>

              {/* Stats */}
              <div style={{ padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                  <MiniStat
                    label="Présence"
                    value={`${enfant.tauxPresence}%`}
                    color={enfant.tauxPresence >= 80 ? colors.success : enfant.tauxPresence >= 60 ? colors.warning : colors.danger}
                    colors={colors}
                  />
                  <MiniStat label="Présent" value={enfant.presences} color={colors.success} colors={colors} />
                  <MiniStat label="Absences" value={enfant.absences} color={colors.danger} colors={colors} />
                  <MiniStat label="Retards" value={enfant.retards} color={colors.warning} colors={colors} />
                </div>

                {/* Alerte paiement */}
                {enfant.montantDu > 0 && (
                  <div style={{
                    background: colors.warningBg,
                    border: `1px solid ${colors.warning}40`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: colors.warning }}>Paiement en attente</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: colors.warning }}>
                      {enfant.montantDu.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liens rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 32 }}>
        <QuickLink to="/parent/presences" label="Présences" desc="Historique des présences" colors={colors} />
        <QuickLink to="/parent/cahier" label="Cahier de texte" desc="Cours et devoirs" colors={colors} />
        <QuickLink to="/parent/paiements" label="Paiements" desc="Historique et reçus" colors={colors} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, colors }: { label: string; value: string | number; color: string; colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"] }) {
  return (
    <div style={{ textAlign: "center", padding: 12, background: colors.bgSecondary, borderRadius: 10 }}>
      <p style={{ fontSize: 20, fontWeight: 600, color }}>{value}</p>
      <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{label}</p>
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
