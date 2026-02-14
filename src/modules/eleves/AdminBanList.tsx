import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getElevesBannis } from "./eleve.service";
import { unbanEleve } from "../paiements/paiement.service";
import { useTheme } from "../../context/ThemeContext";
import type { Eleve } from "./eleve.types";

interface EleveBanni {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  banReason?: string | null;
  banDate?: { toDate?: () => Date };
}

export default function AdminBansList() {
  const { colors } = useTheme();
  const [eleves, setEleves] = useState<EleveBanni[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanning, setUnbanning] = useState<string | null>(null);

  useEffect(() => {
    getElevesBannis()
      .then((data) => {
        // Filter out entries without id and map to EleveBanni
        const bannis: EleveBanni[] = data
          .filter((e): e is Eleve & { id: string } => !!e.id)
          .map((e) => ({
            id: e.id,
            nom: e.nom,
            prenom: e.prenom,
            classe: e.classe,
            banReason: e.banReason,
            banDate: e.banDate && 'toDate' in e.banDate ? e.banDate as { toDate: () => Date } : undefined,
          }));
        setEleves(bannis);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUnban = async (eleveId: string) => {
    const confirm = window.confirm("Lever le bannissement de cet eleve ?");
    if (!confirm) return;

    setUnbanning(eleveId);
    await unbanEleve(eleveId);
    setEleves((prev) => prev.filter((e) => e.id !== eleveId));
    setUnbanning(null);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.danger,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement des eleves bannis...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: colors.dangerBg,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={colors.danger} strokeWidth="2"/>
                <path d="M5.64 5.64L18.36 18.36" stroke={colors.danger} strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Eleves bannis</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{eleves.length} eleve{eleves.length > 1 ? "s" : ""} suspendu{eleves.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link
            to="/admin/stats"
            style={{
              padding: "10px 20px",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              color: colors.textSecondary
            }}
          >
            Voir statistiques
          </Link>
        </div>
      </div>

      {/* Alert */}
      {eleves.length > 0 && (
        <div style={{
          background: colors.dangerBg,
          border: `1px solid ${colors.danger}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 7V10M10 13H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>
            Ces eleves ont ete suspendus pour non-paiement. Ils ne peuvent plus acceder a leur espace.
          </p>
        </div>
      )}

      {/* List */}
      {eleves.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 60,
          textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, background: colors.successBg, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M23.33 7L10.5 19.83L4.67 14" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>Aucun eleve banni</h3>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Tous les eleves sont actifs</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {eleves.map((e) => (
            <div
              key={e.id}
              style={{
                background: colors.bgCard,
                borderRadius: 16,
                border: `1px solid ${colors.danger}`,
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: 20,
                borderBottom: `1px solid ${colors.dangerBg}`,
                display: "flex",
                alignItems: "center",
                gap: 16
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `linear-gradient(135deg, ${colors.danger} 0%, ${colors.danger} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: colors.onGradient, fontWeight: 600, fontSize: 18
                }}>
                  {e.prenom?.[0]}{e.nom?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>
                    {e.prenom} {e.nom}
                  </h3>
                  <span style={{
                    padding: "4px 10px",
                    background: colors.primaryBg,
                    color: colors.primary,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {e.classe}
                  </span>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 12,
                    color: colors.textLight,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600
                  }}>
                    Raison du bannissement
                  </p>
                  <p style={{
                    fontSize: 14,
                    color: colors.danger,
                    margin: 0,
                    padding: "10px 14px",
                    background: colors.dangerBg,
                    borderRadius: 8
                  }}>
                    {e.banReason || "Impayes consecutifs"}
                  </p>
                </div>

                {e.banDate?.toDate && (
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 16px" }}>
                    Banni le {e.banDate.toDate().toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleUnban(e.id)}
                    disabled={unbanning === e.id}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: unbanning === e.id ? colors.successBg : colors.success,
                      border: "none",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 500,
                      color: colors.onGradient,
                      cursor: unbanning === e.id ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    {unbanning === e.id ? (
                      <>
                        <div style={{
                          width: 16, height: 16,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: colors.onGradient,
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }} />
                        Debannissement...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M6.75 9L8.25 10.5L11.25 7.5M15.75 9C15.75 12.7279 12.7279 15.75 9 15.75C5.27208 15.75 2.25 12.7279 2.25 9C2.25 5.27208 5.27208 2.25 9 2.25C12.7279 2.25 15.75 5.27208 15.75 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Debannir
                      </>
                    )}
                  </button>
                  <Link
                    to={`/admin/eleves/${e.id}`}
                    style={{
                      padding: "12px 16px",
                      background: colors.bgSecondary,
                      border: "none",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 500,
                      color: colors.textSecondary,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    Voir profil
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
