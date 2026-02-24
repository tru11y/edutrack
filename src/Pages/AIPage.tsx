import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useSchool } from "../context/SchoolContext";
import {
  getRecommendationsSecure,
  getAtRiskStudentsSecure,
  type Recommendation,
} from "../services/cloudFunctions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AtRiskStudent {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  risks: Array<{ type: string; severity: string; detail: string }>;
}

const CATEGORY_CONFIG = {
  financier:       { label: "Financier",        bg: "#fff7ed", color: "#ea580c", icon: "💰" },
  academique:      { label: "Académique",        bg: "#f0fdf4", color: "#16a34a", icon: "📚" },
  organisationnel: { label: "Organisationnel",   bg: "#eff6ff", color: "#2563eb", icon: "🏫" },
  marketing:       { label: "Croissance",        bg: "#fdf4ff", color: "#9333ea", icon: "📈" },
};

const PRIORITY_CONFIG = {
  haute:  { label: "Haute priorité",   bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
  moyenne:{ label: "Priorité moyenne", bg: "#fefce8", color: "#ca8a04", dot: "#f59e0b" },
  basse:  { label: "Basse priorité",   bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
};

const RISK_TYPE_LABELS: Record<string, string> = {
  absence: "Absences",
  payment: "Impayés",
  grades:  "Notes",
};

const HOW_IT_WORKS = [
  { icon: "💰", title: "Taux de recouvrement financier", desc: "Analyse le ratio montant collecté / montant dû. Alerte si < 80 %." },
  { icon: "📅", title: "Taux de présence", desc: "Surveille les absences. Alerte si le taux global tombe sous 85 %." },
  { icon: "📝", title: "Moyenne générale", desc: "Calcule la moyenne de tous les élèves. Alerte si < 12/20." },
  { icon: "👩‍🏫", title: "Ratio élèves / enseignant", desc: "Norme recommandée : 25-30 élèves par prof. Alerte si > 40." },
  { icon: "🗓", title: "Complétude de l'emploi du temps", desc: "Vérifie que toutes les classes ont au moins 5 créneaux planifiés." },
  { icon: "📖", title: "Utilisation du cahier de texte", desc: "Surveille si chaque enseignant a saisi au moins une entrée les 14 derniers jours." },
  { icon: "⚠️", title: "Élèves à risque", desc: "Croise absences > 30 %, mois impayés ≥ 2 et moyenne < 8/20 pour identifier les profils vulnérables." },
  { icon: "👥", title: "Effectif de l'établissement", desc: "Alerte en dessous de 50 élèves pour maintenir la viabilité économique." },
];

export default function AIPage() {
  const { colors } = useTheme();
  const { school } = useSchool();

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [recRes, riskRes] = await Promise.all([
        getRecommendationsSecure(),
        getAtRiskStudentsSecure(),
      ]);
      setRecs(recRes.recommendations || []);
      setAtRisk(riskRes.students || []);
    } catch {
      setError("Impossible de charger l'analyse IA. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleDownloadPdf() {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const printDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

      // Header
      doc.setFillColor(30, 80, 200);
      doc.rect(0, 0, W, 38, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.text((school?.schoolName || "EduTrack").toUpperCase(), 14, 15);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("RAPPORT D'ANALYSE — INTELLIGENCE ARTIFICIELLE", 14, 26);
      doc.setFontSize(9);
      doc.text(`Généré le ${printDate}`, W - 14, 26, { align: "right" });

      let y = 50;

      // Recommandations
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 80, 200);
      doc.text(`RECOMMANDATIONS (${recs.length})`, 14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Priorité", "Catégorie", "Titre", "Action recommandée"]],
        body: recs.map((r) => [
          PRIORITY_CONFIG[r.priority]?.label || r.priority,
          CATEGORY_CONFIG[r.category as keyof typeof CATEGORY_CONFIG]?.label || r.category,
          r.titre,
          r.action,
        ]),
        headStyles: { fillColor: [30, 80, 200], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [20, 20, 30] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 30 },
          2: { cellWidth: 65 },
          3: { cellWidth: "auto" },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

      // At-risk students
      if (atRisk.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 80, 200);
        doc.text(`ÉLÈVES À RISQUE (${atRisk.length})`, 14, y); y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Élève", "Classe", "Risques identifiés"]],
          body: atRisk.map((s) => [
            `${s.prenom} ${s.nom}`,
            s.classe,
            s.risks.map((r) => `${RISK_TYPE_LABELS[r.type] || r.type}: ${r.detail}`).join(" | "),
          ]),
          headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [20, 20, 30] },
          alternateRowStyles: { fillColor: [255, 248, 248] },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const H = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 80, 200);
      doc.rect(0, H - 10, W, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(`${(school?.schoolName || "EduTrack").toUpperCase()} — Rapport IA généré par EduTrack`, W / 2, H - 4, { align: "center" });

      const date = new Date().toISOString().slice(0, 10);
      doc.save(`rapport_ia_${(school?.schoolName || "ecole").replace(/\s+/g, "_")}_${date}.pdf`);
    } finally {
      setGeneratingPdf(false);
    }
  }

  const cardStyle = {
    background: colors.bgCard,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 20,
  };

  const hautePrio = recs.filter((r) => r.priority === "haute");
  const moyPrio   = recs.filter((r) => r.priority === "moyenne");
  const bassePrio = recs.filter((r) => r.priority === "basse");

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 6px" }}>
            Intelligence Artificielle
          </h1>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
            Analyse en temps réel de votre établissement · {recs.length} recommandation{recs.length > 1 ? "s" : ""} · {atRisk.length} élève{atRisk.length > 1 ? "s" : ""} à risque
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ padding: "10px 16px", background: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: colors.text, cursor: "pointer" }}
          >
            {loading ? "Analyse…" : "↺ Actualiser"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf || loading}
            style={{ padding: "10px 18px", background: colors.primary, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            {generatingPdf ? "Génération…" : "⬇ Rapport PDF"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px 16px", borderRadius: 10, marginBottom: 24, fontSize: 14, background: colors.dangerBg, color: colors.danger, border: `1px solid ${colors.danger}40` }}>
          {error}
        </div>
      )}

      {/* How it works */}
      <div style={{ ...cardStyle, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>
          Comment fonctionne l'IA ?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {HOW_IT_WORKS.map((item) => (
            <div key={item.title} style={{ background: colors.bgSecondary, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>{item.title}</p>
              <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "10px 14px", background: colors.bgSecondary, borderRadius: 10, fontSize: 12, color: colors.textMuted }}>
          <strong style={{ color: colors.text }}>Modèle :</strong> Analyse basée sur des règles métier adaptées au contexte des établissements scolaires
          d'Afrique de l'Ouest. Les seuils sont calibrés selon les normes CEDEAO/UEMOA en éducation.
          Les recommandations sont recalculées à chaque actualisation.
        </div>
      </div>

      {/* Recommendations */}
      {loading ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Analyse en cours…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {recs.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: 48, marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 6px" }}>Aucune anomalie détectée</p>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Tous les indicateurs sont dans les normes recommandées.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>
                Recommandations ({recs.length})
              </h2>
              {[
                { group: hautePrio, cfg: PRIORITY_CONFIG.haute },
                { group: moyPrio,   cfg: PRIORITY_CONFIG.moyenne },
                { group: bassePrio, cfg: PRIORITY_CONFIG.basse },
              ].filter(({ group }) => group.length > 0).map(({ group, cfg }) => (
                <div key={cfg.label} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label} ({group.length})</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                    {group.map((r, i) => {
                      const cat = CATEGORY_CONFIG[r.category as keyof typeof CATEGORY_CONFIG] || { label: r.category, bg: colors.bgSecondary, color: colors.text, icon: "📌" };
                      return (
                        <div key={i} style={{ background: cfg.bg, borderRadius: 14, padding: 18, border: `1px solid ${cfg.dot}30` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 18 }}>{cat.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: cat.bg, color: cat.color }}>
                              {cat.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" }}>{r.titre}</p>
                          <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px", lineHeight: 1.5 }}>{r.detail}</p>
                          <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#333" }}>
                            <strong>→ Action :</strong> {r.action}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* At-risk students */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>
              Élèves à risque ({atRisk.length})
            </h2>
            {atRisk.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", padding: "24px 0" }}>
                ✅ Aucun élève à risque identifié actuellement.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: colors.bgSecondary }}>
                    <tr>
                      {["Élève", "Classe", "Risques identifiés"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map((s, i) => (
                      <tr key={s.eleveId} style={{ borderTop: i > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                        <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: colors.text }}>
                          {s.prenom} {s.nom}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: colors.textMuted }}>
                          {s.classe}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {s.risks.map((r, j) => (
                              <span key={j} style={{
                                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                background: r.severity === "danger" ? "#fef2f2" : "#fefce8",
                                color: r.severity === "danger" ? "#dc2626" : "#ca8a04",
                                border: `1px solid ${r.severity === "danger" ? "#fca5a5" : "#fde68a"}`,
                              }}>
                                {RISK_TYPE_LABELS[r.type] || r.type}: {r.detail}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
