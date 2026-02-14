import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getPaiementStats, type PaiementStats } from "../paiements/paiement.stats";
import { getElevesARisque, type EleveRisk } from "../analytics/risk.service";
import { getElevesRisqueBan } from "../paiements/autoban.service";
import { useTheme } from "../../context/ThemeContext";

interface EleveBanni {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  banReason: string;
}

export default function AdminStats() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<PaiementStats | null>(null);
  const [elevesRisque, setElevesRisque] = useState<EleveRisk[]>([]);
  const [elevesRisqueBan, setElevesRisqueBan] = useState<
    Array<{ id: string; nom: string; prenom: string; classe: string; moisImpayes: number }>
  >([]);
  const [bannis, setBannis] = useState<EleveBanni[]>([]);
  const [totalEleves, setTotalEleves] = useState(0);
  const [totalProfs, setTotalProfs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [paiementStats, risques, risquesBan, bannisSnap, elevesSnap, profsSnap] = await Promise.all([
        getPaiementStats(),
        getElevesARisque(),
        getElevesRisqueBan(),
        getDocs(query(collection(db, "eleves"), where("isBanned", "==", true))),
        getDocs(collection(db, "eleves")),
        getDocs(collection(db, "professeurs")),
      ]);

      setStats(paiementStats);
      setElevesRisque(risques);
      setElevesRisqueBan(risquesBan);
      setTotalEleves(elevesSnap.size);
      setTotalProfs(profsSnap.size);
      setBannis(
        bannisSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EleveBanni, "id">),
        }))
      );

      setLoading(false);
    };

    load();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement des statistiques...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Taux de couverture calculé dans paiement.stats.ts
  // = (totalPaye / totalAttendu) * 100
  const tauxRecouvrement = stats.tauxCouverture ?? (
    stats.totalAttendu > 0
      ? Math.round((stats.totalEncaisse / stats.totalAttendu) * 100)
      : 0
  );

  const tauxBan = totalEleves > 0 ? Math.round((bannis.length / totalEleves) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Statistiques</h1>
          <Link
            to="/admin"
            style={{
              padding: "10px 20px",
              background: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              color: colors.textSecondary,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11.25 14.25L6 9L11.25 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour au dashboard
          </Link>
        </div>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Vue detaillee des indicateurs de performance</p>
      </div>

      {/* KPIs Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KPICard
          label="Total Eleves"
          value={totalEleves}
          icon="users"
          color={colors.primary}
          trend={`${bannis.length} bannis`}
          trendColor={colors.danger}
          colors={colors}
        />
        <KPICard
          label="Professeurs"
          value={totalProfs}
          icon="teacher"
          color={colors.primary}
          colors={colors}
        />
        <KPICard
          label="Taux Recouvrement"
          value={`${tauxRecouvrement}%`}
          icon="percent"
          color={tauxRecouvrement >= 80 ? colors.success : tauxRecouvrement >= 60 ? colors.warning : colors.danger}
          trend={tauxRecouvrement >= 80 ? "Excellent" : tauxRecouvrement >= 60 ? "Correct" : "A ameliorer"}
          trendColor={tauxRecouvrement >= 80 ? colors.success : tauxRecouvrement >= 60 ? colors.warning : colors.danger}
          colors={colors}
        />
        <KPICard
          label="Eleves a risque"
          value={elevesRisque.length + elevesRisqueBan.length}
          icon="alert"
          color={colors.warning}
          trend={`${tauxBan}% bannis`}
          trendColor={colors.danger}
          colors={colors}
        />
      </div>

      {/* Financial Stats */}
      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 24,
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
          Finances
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          <FinanceCard label="Total encaisse" value={stats.totalEncaisse} color={colors.success} colors={colors} />
          <FinanceCard label="Total attendu" value={stats.totalAttendu} color={colors.primary} colors={colors} />
          <FinanceCard label="Impayes" value={stats.totalImpayes} color={colors.danger} colors={colors} />
          <FinanceCard label="Taux recouvrement" value={`${tauxRecouvrement}%`} isPercent color={tauxRecouvrement >= 80 ? colors.success : colors.warning} colors={colors} />
          <FinanceCard label="Nb paiements" value={stats.nombrePaiements} isCount color={colors.primary} colors={colors} />
        </div>
      </div>

      {/* Payment Distribution */}
      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 24,
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 20 }}>
          Repartition des paiements
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <DistributionCard label="Payes" value={stats.parStatut.paye} total={stats.nombrePaiements} color={colors.success} bg={colors.successBg} />
          <DistributionCard label="Partiels" value={stats.parStatut.partiel} total={stats.nombrePaiements} color={colors.warning} bg={colors.warningBg} />
          <DistributionCard label="Impayes" value={stats.parStatut.impaye} total={stats.nombrePaiements} color={colors.danger} bg={colors.dangerBg} />
        </div>
      </div>

      {/* Two columns layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* At risk - Presences */}
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          overflow: "hidden"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.warning }} />
              Eleves a risque (Absences)
            </h2>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{elevesRisque.length} eleves</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {elevesRisque.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Aucun eleve a risque</p>
              </div>
            ) : (
              elevesRisque.map((e, idx) => (
                <div
                  key={e.id}
                  style={{
                    padding: "12px 20px",
                    borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: colors.dangerBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: colors.danger, fontWeight: 600, fontSize: 12
                    }}>
                      {e.prenom?.[0]}{e.nom?.[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>
                        {e.prenom} {e.nom}
                      </p>
                      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{e.classe}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: colors.danger, margin: 0 }}>{e.tauxAbsence}%</p>
                    <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>absences</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* At risk - Payments */}
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          overflow: "hidden"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.danger }} />
              Risque de bannissement
            </h2>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{elevesRisqueBan.length} eleves</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {elevesRisqueBan.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Aucun eleve a risque</p>
              </div>
            ) : (
              elevesRisqueBan.map((e, idx) => (
                <div
                  key={e.id}
                  style={{
                    padding: "12px 20px",
                    borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: e.moisImpayes >= 2 ? colors.dangerBg : colors.warningBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: e.moisImpayes >= 2 ? colors.danger : colors.warning,
                      fontWeight: 600, fontSize: 12
                    }}>
                      {e.prenom?.[0]}{e.nom?.[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>
                        {e.prenom} {e.nom}
                      </p>
                      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{e.classe}</p>
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    background: e.moisImpayes >= 2 ? colors.dangerBg : colors.warningBg,
                    color: e.moisImpayes >= 2 ? colors.danger : colors.warning,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {e.moisImpayes} mois
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Banned students */}
      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${colors.borderLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: colors.dangerBg
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.danger, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4.22 4.22L13.78 13.78" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Eleves bannis
          </h2>
          <Link
            to="/admin/bans"
            style={{
              fontSize: 13,
              color: colors.danger,
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Voir tout ({bannis.length})
          </Link>
        </div>
        {bannis.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Aucun eleve banni</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: colors.borderLight }}>
            {bannis.slice(0, 6).map((e) => (
              <div key={e.id} style={{ padding: 16, background: colors.bgCard }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: colors.dangerBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: colors.danger, fontWeight: 600, fontSize: 14
                  }}>
                    {e.prenom?.[0]}{e.nom?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>
                      {e.prenom} {e.nom}
                    </p>
                    <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{e.classe}</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: colors.danger, margin: "8px 0 0", padding: "6px 10px", background: colors.dangerBg, borderRadius: 6 }}>
                  {e.banReason || "Impayes"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color, trend, trendColor, colors }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
  trendColor?: string;
  colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"];
}) {
  const icons: Record<string, React.ReactNode> = {
    users: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    teacher: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 15L3.5 10L12 5L20.5 10L12 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.5 10V16L12 21L20.5 16V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    percent: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 5L5 19M9 7C9 8.10457 8.10457 9 7 9C5.89543 9 5 8.10457 5 7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7ZM19 17C19 18.1046 18.1046 19 17 19C15.8954 19 15 18.1046 15 17C15 15.8954 15.8954 15 17 15C18.1046 15 19 15.8954 19 17Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    alert: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };

  return (
    <div style={{
      background: colors.bgCard,
      borderRadius: 16,
      border: `1px solid ${colors.border}`,
      padding: 20
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: color + "20",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {icons[icon]}
        </div>
        {trend && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: trendColor || colors.textMuted,
            padding: "4px 8px",
            background: (trendColor || colors.textMuted) + "20",
            borderRadius: 20
          }}>
            {trend}
          </span>
        )}
      </div>
      <p style={{ fontSize: 32, fontWeight: 700, color: colors.text, margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{label}</p>
    </div>
  );
}

function FinanceCard({ label, value, color, isPercent, isCount, colors }: {
  label: string;
  value: string | number;
  color: string;
  isPercent?: boolean;
  isCount?: boolean;
  colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"];
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 24, fontWeight: 700, color, margin: "0 0 4px" }}>
        {isPercent || isCount ? value : `${(value as number).toLocaleString("fr-FR")} F`}
      </p>
      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>{label}</p>
    </div>
  );
}

function DistributionCard({ label, value, total, color, bg }: {
  label: string;
  value: number;
  total: number;
  color: string;
  bg: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div style={{
      padding: 20,
      background: bg,
      borderRadius: 12,
      textAlign: "center"
    }}>
      <p style={{ fontSize: 36, fontWeight: 700, color, margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color, margin: "0 0 8px" }}>{label}</p>
      <div style={{ height: 6, background: color + "30", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <p style={{ fontSize: 12, color: color, margin: "8px 0 0", fontWeight: 500 }}>{percent}% du total</p>
    </div>
  );
}
