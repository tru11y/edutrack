import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEleves } from "../modules/eleves/eleve.service";
import type { Eleve } from "../modules/eleves/eleve.types";

export default function ElevesList() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "byClass">("all");

  useEffect(() => {
    getAllEleves()
      .then((data) => {
        // Trier par classe puis par nom
        const sorted = data.sort((a, b) => {
          if (a.classe !== b.classe) return (a.classe || "").localeCompare(b.classe || "");
          return a.nom.localeCompare(b.nom);
        });
        setEleves(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))].sort();

  const filtered = eleves.filter((e) => {
    const matchSearch =
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase());
    const matchClasse = !filterClasse || e.classe === filterClasse;
    return matchSearch && matchClasse;
  });

  // Grouper par classe
  const groupedByClass = classes.reduce((acc, classe) => {
    acc[classe] = filtered.filter((e) => e.classe === classe);
    return acc;
  }, {} as Record<string, Eleve[]>);

  // Stats par classe
  const classStats = classes.map((classe) => ({
    classe,
    total: eleves.filter((e) => e.classe === classe).length,
    actifs: eleves.filter((e) => e.classe === classe && e.statut === "actif").length,
    garcons: eleves.filter((e) => e.classe === classe && e.sexe === "M").length,
    filles: eleves.filter((e) => e.classe === classe && e.sexe === "F").length,
  }));

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement des eleves...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Eleves</h1>
              <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{eleves.length} eleve{eleves.length > 1 ? "s" : ""} inscrits</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/classes" style={{ padding: "12px 20px", background: "#f1f5f9", color: "#475569", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
              Gerer les classes
            </Link>
            <Link to="/eleves/nouveau" style={{ padding: "12px 20px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px -3px rgba(99, 102, 241, 0.4)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Nouvel eleve
            </Link>
          </div>
        </div>
      </div>

      {/* Stats par classe */}
      {classStats.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(classStats.length, 5)}, 1fr)`, gap: 12, marginBottom: 24 }}>
          {classStats.map((stat) => (
            <button
              key={stat.classe}
              onClick={() => setFilterClasse(filterClasse === stat.classe ? "" : stat.classe)}
              style={{
                background: filterClasse === stat.classe ? "#6366f1" : "#fff",
                borderRadius: 12,
                padding: 16,
                border: filterClasse === stat.classe ? "2px solid #6366f1" : "1px solid #e2e8f0",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <p style={{ fontSize: 12, color: filterClasse === stat.classe ? "rgba(255,255,255,0.8)" : "#64748b", margin: "0 0 4px" }}>{stat.classe}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: filterClasse === stat.classe ? "#fff" : "#1e293b", margin: 0 }}>{stat.total}</p>
              <p style={{ fontSize: 11, color: filterClasse === stat.classe ? "rgba(255,255,255,0.7)" : "#94a3b8", margin: "4px 0 0" }}>
                {stat.garcons}G / {stat.filles}F
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Rechercher un eleve..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}
        />
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          aria-label="Filtrer par classe"
          style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", minWidth: 160 }}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c} ({eleves.filter(e => e.classe === c).length})</option>
          ))}
        </select>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setViewMode("all")}
            style={{ padding: "8px 16px", background: viewMode === "all" ? "#fff" : "transparent", color: viewMode === "all" ? "#1e293b" : "#64748b", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: viewMode === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode("byClass")}
            style={{ padding: "8px 16px", background: viewMode === "byClass" ? "#fff" : "transparent", color: viewMode === "byClass" ? "#1e293b" : "#64748b", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: viewMode === "byClass" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
          >
            Par classe
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            {eleves.length === 0 ? "Aucun eleve inscrit" : "Aucun eleve trouve"}
          </p>
        </div>
      ) : viewMode === "byClass" ? (
        // Vue par classe
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {classes.filter(c => !filterClasse || c === filterClasse).map((classe) => {
            const classEleves = groupedByClass[classe] || [];
            if (classEleves.length === 0) return null;
            return (
              <div key={classe} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                      {classe.slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{classe}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{classEleves.length} eleve{classEleves.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, padding: 16 }}>
                  {classEleves.map((eleve) => (
                    <Link key={eleve.id} to={`/eleves/${eleve.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#f8fafc", borderRadius: 10, textDecoration: "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: eleve.sexe === "M" ? "#dbeafe" : "#fce7f3", color: eleve.sexe === "M" ? "#3b82f6" : "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
                        {eleve.prenom[0]}{eleve.nom[0]}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500, color: "#1e293b", fontSize: 14 }}>{eleve.prenom} {eleve.nom}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{eleve.sexe === "M" ? "Garcon" : "Fille"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Vue liste
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Eleve</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Classe</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sexe</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Statut</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((eleve) => (
                <tr key={eleve.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: eleve.sexe === "M" ? "#dbeafe" : "#fce7f3", color: eleve.sexe === "M" ? "#3b82f6" : "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14 }}>
                        {eleve.prenom[0]}{eleve.nom[0]}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500, color: "#1e293b" }}>{eleve.prenom} {eleve.nom}</p>
                        {eleve.parents && eleve.parents.length > 0 && (
                          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                            {eleve.parents[0].nom} - {eleve.parents[0].telephone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "4px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 13, color: "#475569" }}>
                      {eleve.classe}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#64748b", fontSize: 14 }}>
                    {eleve.sexe === "M" ? "Masculin" : "Feminin"}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "4px 12px", background: eleve.statut === "actif" ? "#ecfdf5" : "#fef2f2", color: eleve.statut === "actif" ? "#10b981" : "#ef4444", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                      {eleve.statut === "actif" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <Link to={`/eleves/${eleve.id}`} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
                      Voir
                    </Link>
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
