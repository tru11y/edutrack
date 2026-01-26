import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { exportCahierToPDF } from "./cahier.export";

interface CahierEntry {
  id: string;
  date: string;
  classe: string;
  coursId: string;
  coursNom?: string;
  profId: string;
  profNom?: string;
  contenu: string;
  devoirs?: string;
  isSigned: boolean;
  eleves?: string[];
}

export default function AdminCahierList() {
  const [entries, setEntries] = useState<CahierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "signed" | "unsigned">("all");
  const [selectedClasse, setSelectedClasse] = useState("");
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cahierSnap, elevesSnap] = await Promise.all([
        getDocs(collection(db, "cahier")),
        getDocs(collection(db, "eleves"))
      ]);

      const cls = new Set<string>();
      elevesSnap.forEach((d) => cls.add(d.data().classe));
      setClasses(Array.from(cls).sort());

      const data = cahierSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CahierEntry, "id">)
      }));

      data.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(data);
      setLoading(false);
    };

    load();
  }, []);

  const filteredEntries = entries.filter((e) => {
    const matchFilter = filter === "all" ||
      (filter === "signed" && e.isSigned) ||
      (filter === "unsigned" && !e.isSigned);
    const matchClasse = selectedClasse === "" || e.classe === selectedClasse;
    return matchFilter && matchClasse;
  });

  const stats = {
    total: entries.length,
    signed: entries.filter(e => e.isSigned).length,
    unsigned: entries.filter(e => !e.isSigned).length
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement du cahier de texte...</p>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Cahier de texte</h1>
          <button
            onClick={() => exportCahierToPDF(filteredEntries, {
              titre: "Cahier de texte - EDUTRACK",
              periode: selectedClasse ? `Classe: ${selectedClasse}` : "Toutes les classes"
            })}
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exporter PDF
          </button>
        </div>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Consultez et gerez les cahiers de texte de toutes les classes</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard label="Total entrees" value={stats.total} color="#6366f1" />
        <StatCard label="Signes" value={stats.signed} color="#10b981" />
        <StatCard label="Non signes" value={stats.unsigned} color="#f59e0b" />
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Classe filter */}
          <div>
            <select
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              aria-label="Filtrer par classe"
              style={{
                padding: "10px 36px 10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
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
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "all", label: "Tous", count: stats.total },
              { value: "signed", label: "Signes", count: stats.signed, color: "#10b981" },
              { value: "unsigned", label: "Non signes", count: stats.unsigned, color: "#f59e0b" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                style={{
                  padding: "8px 14px",
                  border: "1px solid",
                  borderColor: filter === f.value ? (f.color || "#6366f1") : "#e2e8f0",
                  background: filter === f.value ? (f.color || "#6366f1") + "10" : "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: filter === f.value ? (f.color || "#6366f1") : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {f.label}
                <span style={{
                  background: filter === f.value ? (f.color || "#6366f1") : "#e2e8f0",
                  color: filter === f.value ? "#fff" : "#64748b",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {filteredEntries.length === 0 ? (
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
              <path d="M19.25 3.5H8.75C7.09315 3.5 5.75 4.84315 5.75 6.5V21.5C5.75 23.1569 7.09315 24.5 8.75 24.5H19.25C20.9069 24.5 22.25 23.1569 22.25 21.5V6.5C22.25 4.84315 20.9069 3.5 19.25 3.5Z" stroke="#94a3b8" strokeWidth="2"/>
              <path d="M10.5 10.5H17.5M10.5 14H17.5M10.5 17.5H14" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Aucune entree trouvee</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    padding: "8px 14px",
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0"
                  }}>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                      {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                      {new Date(entry.date).getDate()}
                    </p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                      {new Date(entry.date).toLocaleDateString("fr-FR", { month: "short" })}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        padding: "4px 10px",
                        background: "#eef2ff",
                        color: "#6366f1",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {entry.classe}
                      </span>
                      <span style={{ fontSize: 14, color: "#1e293b", fontWeight: 500 }}>
                        {entry.coursNom || entry.coursId}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                      Prof: {entry.profNom || entry.profId} | {entry.eleves?.length || 0} eleves presents
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: "6px 12px",
                  background: entry.isSigned ? "#ecfdf5" : "#fffbeb",
                  color: entry.isSigned ? "#059669" : "#d97706",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  {entry.isSigned ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11.67 3.5L5.25 9.92L2.33 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Signe
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 4.08V7L8.75 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      En attente
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    Contenu du cours
                  </p>
                  <p style={{ fontSize: 14, color: "#1e293b", margin: 0, lineHeight: 1.6 }}>
                    {entry.contenu || "Aucun contenu renseigne"}
                  </p>
                </div>

                {entry.devoirs && (
                  <div style={{
                    padding: 16,
                    background: "#fffbeb",
                    borderRadius: 10,
                    border: "1px solid #fef3c7"
                  }}>
                    <p style={{ fontSize: 12, color: "#92400e", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10.5 2.33H3.5C2.85 2.33 2.33 2.85 2.33 3.5V10.5C2.33 11.15 2.85 11.67 3.5 11.67H10.5C11.15 11.67 11.67 11.15 11.67 10.5V3.5C11.67 2.85 11.15 2.33 10.5 2.33Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M4.67 7H9.33M4.67 9.33H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Devoirs
                    </p>
                    <p style={{ fontSize: 14, color: "#78350f", margin: 0, lineHeight: 1.6 }}>
                      {entry.devoirs}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      padding: 20
    }}>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}
