import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProfesseurs } from "./professeur.service";
import type { Professeur } from "./professeur.types";

export default function ProfesseursList() {
  const [profs, setProfs] = useState<Professeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllProfesseurs().then((data) => {
      setProfs(data);
      setLoading(false);
    });
  }, []);

  const filteredProfs = profs.filter((p) => {
    if (search === "") return true;
    const fullName = `${p.prenom} ${p.nom}`.toLowerCase();
    const matieres = (p.matieres || []).join(" ").toLowerCase();
    return fullName.includes(search.toLowerCase()) || matieres.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#8b5cf6",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement des professeurs...</p>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Professeurs</h1>
          <Link
            to="/admin/professeurs/create"
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px -3px rgba(139, 92, 246, 0.4)"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Ajouter un professeur
          </Link>
        </div>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
          {profs.length} professeur{profs.length > 1 ? "s" : ""} enregistre{profs.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="8" cy="8" r="5.5" stroke="#94a3b8" strokeWidth="1.5"/>
            <path d="M12 12L16 16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou matiere..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 44px",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProfs.length === 0 ? (
        <div style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 60,
          textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, background: "#f1f5f9", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 17.5L4.67 11.67L14 5.83L23.33 11.67L14 17.5Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.67 11.67V18.67L14 24.5L23.33 18.67V11.67" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            {search ? "Aucun professeur trouve" : "Aucun professeur enregistre"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filteredProfs.map((prof) => (
            <div
              key={prof.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                padding: 24,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#8b5cf6";
                e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(139, 92, 246, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 600, fontSize: 18,
                  flexShrink: 0
                }}>
                  {prof.prenom?.[0]}{prof.nom?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>
                    {prof.prenom} {prof.nom}
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    {prof.telephone || "Tel. non renseigne"}
                  </p>
                </div>
                <StatusBadge statut={prof.statut} />
              </div>

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  Matieres
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(prof.matieres && prof.matieres.length > 0) ? (
                    prof.matieres.map((m, i) => (
                      <span key={i} style={{
                        padding: "4px 10px",
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>Non renseigne</span>
                  )}
                </div>
              </div>

              {prof.telephone && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14.67 11.27V13.27C14.67 13.74 14.29 14.13 13.81 14.13H13.67C7.23 13.67 2.33 8.77 1.87 2.33V2.19C1.87 1.71 2.26 1.33 2.73 1.33H4.73C5.13 1.33 5.48 1.61 5.56 2L6.18 5.13C6.24 5.43 6.13 5.73 5.91 5.92L4.64 7.03C5.68 9.03 7.3 10.65 9.3 11.69L10.41 10.42C10.6 10.2 10.9 10.09 11.2 10.15L14.33 10.77C14.72 10.85 15 11.2 15 11.6V11.27H14.67Z" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{prof.telephone}</span>
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
                <Link
                  to={`/admin/professeurs/${prof.id}`}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background: "#f8fafc",
                    color: "#475569",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: "center",
                    transition: "all 0.15s"
                  }}
                >
                  Voir le profil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ statut }: { statut?: string }) {
  const isActive = statut === "actif" || !statut;
  return (
    <span style={{
      padding: "4px 10px",
      background: isActive ? "#ecfdf5" : "#fef2f2",
      color: isActive ? "#059669" : "#dc2626",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase"
    }}>
      {isActive ? "Actif" : "Inactif"}
    </span>
  );
}
