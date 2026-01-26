import { useEffect, useState } from "react";
import { getAllEleves } from "../modules/eleves/eleve.service";
import type { Eleve } from "../modules/eleves/eleve.types";

export default function MesEleves() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");

  useEffect(() => {
    getAllEleves()
      .then((data) => {
        setEleves(data.filter((e) => e.statut === "actif"));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const classes = [...new Set(eleves.map((e) => e.classe).filter(Boolean))];
  const filteredEleves = eleves.filter((e) => !filterClasse || e.classe === filterClasse);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.34 15.66 16 14 16H6C4.34 16 3 17.34 3 19V21M21 21V19C21 17.79 20.21 16.76 19.12 16.42M15.62 3.58C16.7 3.93 17.49 4.96 17.49 6.16C17.49 7.36 16.7 8.39 15.62 8.74M12 9C12 10.66 10.66 12 9 12C7.34 12 6 10.66 6 9C6 7.34 7.34 6 9 6C10.66 6 12 7.34 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Mes eleves</h1>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{filteredEleves.length} eleve{filteredEleves.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          aria-label="Filtrer par classe"
          style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", minWidth: 200 }}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filteredEleves.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto 16px", color: "#cbd5e1" }}>
            <path d="M34 42V38C34 34.69 31.31 32 28 32H12C8.69 32 6 34.69 6 38V42M42 42V38C42 35.58 40.42 33.53 38.24 32.84M31.24 7.16C33.4 7.86 34.98 9.92 34.98 12.32C34.98 14.72 33.4 16.78 31.24 17.48M24 18C24 21.31 21.31 24 18 24C14.69 24 12 21.31 12 18C12 14.69 14.69 12 18 12C21.31 12 24 14.69 24 18Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Aucun eleve</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {filteredEleves.map((eleve) => (
            <div
              key={eleve.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                padding: 20,
                textAlign: "center",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: eleve.sexe === "M" ? "#dbeafe" : "#fce7f3",
                color: eleve.sexe === "M" ? "#3b82f6" : "#ec4899",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 24,
                margin: "0 auto 12px"
              }}>
                {eleve.prenom[0].toUpperCase()}
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#1e293b", fontSize: 16 }}>
                {eleve.prenom}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {eleve.classe}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
