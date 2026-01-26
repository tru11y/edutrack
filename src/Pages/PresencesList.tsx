import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPresences } from "../modules/presences/presence.service";
import { useAuth } from "../context/AuthContext";
import type { PresenceCoursPayload } from "../modules/presences/presence.types";

interface PresenceDoc extends PresenceCoursPayload { id: string; }

export default function PresencesList() {
  useAuth(); // For context availability
  const [presences, setPresences] = useState<PresenceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");

  useEffect(() => {
    getAllPresences().then((data) => {
      setPresences(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }).catch((err) => { console.error(err); setLoading(false); });
  }, []);

  const classes = [...new Set(presences.map((p) => p.classe).filter(Boolean))];
  const filtered = presences.filter((p) => !filterClasse || p.classe === filterClasse);

  const getStats = (items: PresenceDoc["presences"]) => {
    const presents = items.filter((i) => i.statut === "present").length;
    const absents = items.filter((i) => i.statut === "absent").length;
    const retards = items.filter((i) => i.statut === "retard").length;
    const autorises = items.filter((i) => i.statutMetier === "autorise").length;
    const refuses = items.filter((i) => i.statutMetier === "refuse").length;
    return { presents, absents, retards, autorises, refuses, total: items.length };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement des presences...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Presences</h1>
              <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{presences.length} appel{presences.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link to="/presences/appel" style={{ padding: "12px 20px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Faire l'appel
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} aria-label="Filtrer par classe" style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", minWidth: 200 }}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{presences.length === 0 ? "Aucun appel enregistre" : "Aucune presence trouvee"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((presence) => {
            const stats = getStats(presence.presences || []);
            return (
              <div key={presence.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12, fontWeight: 600, flexDirection: "column" }}>
                      <span>{new Date(presence.date).getDate()}</span>
                      <span style={{ fontSize: 10 }}>{new Date(presence.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: "#1e293b", fontSize: 16 }}>{presence.classe}</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{new Date(presence.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                    </div>
                  </div>
                  <span style={{ padding: "6px 12px", background: "#f1f5f9", color: "#64748b", borderRadius: 8, fontSize: 13 }}>{stats.total} eleves</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 12px", background: "#ecfdf5", color: "#10b981", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{stats.presents} presents</span>
                  <span style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{stats.absents} absents</span>
                  {stats.retards > 0 && <span style={{ padding: "6px 12px", background: "#fffbeb", color: "#f59e0b", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{stats.retards} retards</span>}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <span style={{ padding: "6px 12px", background: "#ecfdf5", color: "#10b981", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                      {stats.autorises} autorises
                    </span>
                    {stats.refuses > 0 && (
                      <span style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                        {stats.refuses} refuses
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
