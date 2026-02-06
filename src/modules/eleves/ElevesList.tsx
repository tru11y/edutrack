import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEleves } from "./eleve.service";
import { useTheme } from "../../context/ThemeContext";
import type { Eleve } from "./eleve.types";

export default function ElevesList() {
  const { colors } = useTheme();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "actif" | "banni">("all");

  useEffect(() => {
    getAllEleves().then((data) => {
      setEleves(data.filter((e) => !!e.id));
      setLoading(false);
    });
  }, []);

  const classes = [...new Set(eleves.map(e => e.classe))].sort();

  const filteredEleves = eleves.filter((e) => {
    const matchSearch = search === "" ||
      `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase());
    const matchClasse = filterClasse === "" || e.classe === filterClasse;
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "actif" && !e.isBanned) ||
      (filterStatus === "banni" && e.isBanned);
    return matchSearch && matchClasse && matchStatus;
  });

  const stats = {
    total: eleves.length,
    actifs: eleves.filter(e => !e.isBanned).length,
    bannis: eleves.filter(e => e.isBanned).length
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement des eleves...</p>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Eleves</h1>
          <Link
            to="/admin/eleves/create"
            style={{
              padding: "10px 20px",
              background: `linear-gradient(135deg, ${colors.info} 0%, ${colors.primary} 100%)`,
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: `0 4px 14px -3px ${colors.primary}66`
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Ajouter un eleve
          </Link>
        </div>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          {stats.total} eleves | {stats.actifs} actifs | {stats.bannis} bannis
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ position: "relative" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="8" cy="8" r="5.5" stroke={colors.textLight} strokeWidth="1.5"/>
                <path d="M12 12L16 16" stroke={colors.textLight} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un eleve..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 44px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  background: colors.bgInput,
                  color: colors.text
                }}
              />
            </div>
          </div>

          {/* Classe filter */}
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            aria-label="Filtrer par classe"
            style={{
              padding: "12px 36px 12px 14px",
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              fontSize: 14,
              background: colors.bgInput,
              color: colors.text,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center"
            }}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "all", label: "Tous" },
              { value: "actif", label: "Actifs", color: colors.success },
              { value: "banni", label: "Bannis", color: colors.danger },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value as typeof filterStatus)}
                style={{
                  padding: "8px 14px",
                  border: "1px solid",
                  borderColor: filterStatus === f.value ? (f.color || colors.primary) : colors.border,
                  background: filterStatus === f.value ? (f.color || colors.primary) + "20" : colors.bgCard,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: filterStatus === f.value ? (f.color || colors.primary) : colors.textMuted,
                  cursor: "pointer"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {filteredEleves.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 60,
          textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, background: colors.bgSecondary, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M19.25 22.75V20.75C19.25 19.6891 18.8286 18.6717 18.0784 17.9216C17.3283 17.1714 16.3109 16.75 15.25 16.75H8.75C7.68913 16.75 6.67172 17.1714 5.92157 17.9216C5.17143 18.6717 4.75 19.6891 4.75 20.75V22.75M15.25 8.75C15.25 10.9591 13.4591 12.75 11.25 12.75C9.04086 12.75 7.25 10.9591 7.25 8.75C7.25 6.54086 9.04086 4.75 11.25 4.75C13.4591 4.75 15.25 6.54086 15.25 8.75Z" stroke={colors.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun eleve trouve</p>
        </div>
      ) : (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Eleve</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Classe</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Parents</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Statut</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Paiement</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEleves.map((e, idx) => (
                <tr
                  key={e.id}
                  style={{
                    borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none",
                    transition: "background 0.15s"
                  }}
                >
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: e.isBanned
                          ? `linear-gradient(135deg, ${colors.danger} 0%, #dc2626 100%)`
                          : `linear-gradient(135deg, ${colors.info} 0%, ${colors.primary} 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 600, fontSize: 14
                      }}>
                        {e.prenom?.[0]}{e.nom?.[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>
                          {e.prenom} {e.nom}
                        </p>
                        <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                          {e.sexe === "M" ? "Garcon" : e.sexe === "F" ? "Fille" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{
                      padding: "4px 10px",
                      background: colors.primaryBg,
                      color: colors.primary,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500
                    }}>
                      {e.classe}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {Array.isArray(e.parents) && e.parents.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {e.parents.slice(0, 2).map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{p.nom}</span>
                            <span style={{
                              fontSize: 11,
                              color: colors.textMuted,
                              padding: "2px 6px",
                              background: colors.bgSecondary,
                              borderRadius: 4
                            }}>
                              {p.lien}
                            </span>
                          </div>
                        ))}
                        {e.parents.length > 2 && (
                          <span style={{ fontSize: 12, color: colors.textMuted }}>+{e.parents.length - 2} autres</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: colors.textLight }}>Non renseigne</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      background: e.isBanned ? colors.dangerBg : colors.successBg,
                      color: e.isBanned ? colors.danger : colors.success,
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {e.isBanned ? "Banni" : "Actif"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      background: e.statutPaiementMensuel === "a_jour" ? colors.successBg : colors.dangerBg,
                      color: e.statutPaiementMensuel === "a_jour" ? colors.success : colors.danger,
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {e.statutPaiementMensuel === "a_jour" ? "A jour" : "Non a jour"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Link
                        to={`/admin/eleves/${e.id}`}
                        style={{
                          padding: "8px 14px",
                          background: colors.bgSecondary,
                          color: colors.textSecondary,
                          borderRadius: 8,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 500
                        }}
                      >
                        Voir
                      </Link>
                      <Link
                        to={`/admin/eleves/${e.id}/paiements`}
                        style={{
                          padding: "8px 14px",
                          background: colors.primaryBg,
                          color: colors.primary,
                          borderRadius: 8,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 500
                        }}
                      >
                        Paiements
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
