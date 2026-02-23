import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Timestamp, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getAllPaiements } from "./paiement.service";
import { exportRecuPaiementPDF } from "./paiement.pdf";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useSchool } from "../../context/SchoolContext";
import { useTenant } from "../../context/TenantContext";
import type { Paiement } from "./paiement.types";

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "object" && "seconds" in val) return new Date((val as { seconds: number }).seconds * 1000);
  if (typeof val === "string") return new Date(val);
  return null;
}

function formatDate(val: unknown): string {
  const d = toDate(val);
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPaiementsList() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { school } = useSchool();
  const { schoolId } = useTenant();
  const isGestionnaire = user?.role === "gestionnaire";

  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paye" | "partiel" | "impaye">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    getAllPaiements(schoolId).then((d) => {
      setPaiements(d);
      setLoading(false);
    });
  }, [schoolId]);

  async function handleDownloadPDF(p: Paiement) {
    // Reconstituer prénom/nom depuis eleveNom
    const parts = (p.eleveNom || "").split(" ");
    const elevePrenom = parts[0] || "";
    const eleveNom = parts.slice(1).join(" ") || elevePrenom;

    const generatedByName = user?.prenom && user?.nom
      ? `${user.prenom} ${user.nom}`.trim()
      : user?.email || "Administration";

    const filename = exportRecuPaiementPDF(p, {
      elevePrenom,
      eleveNom,
      classe: "",
      adminNom: generatedByName,
      generatedByName,
      schoolName: school?.schoolName,
      schoolAdresse: school?.adresse,
      schoolTelephone: school?.telephone,
      schoolEmail: school?.email,
    });

    // Sauvegarder la trace du reçu généré dans Firestore
    try {
      await addDoc(collection(db, "sauvegardes"), {
        type: "recu_paiement",
        fichier: filename,
        paiementId: p.id || "",
        reference: p.reference || "",
        eleveId: p.eleveId,
        eleveNom: p.eleveNom,
        mois: p.mois,
        montantPaye: p.montantPaye,
        montantTotal: p.montantTotal,
        statut: p.statut,
        schoolId: schoolId || "",
        generatedAt: serverTimestamp(),
        generatedBy: user?.uid || "",
        generatedByName,
      });
    } catch (err) {
      // Non-bloquant — la génération du PDF a déjà réussi
      console.warn("Sauvegarde du reçu non enregistrée :", err);
    }
  }

  const filteredPaiements = paiements.filter((p) => {
    const matchFilter = filter === "all" || p.statut === filter;
    const matchSearch = search === "" ||
      p.eleveNom?.toLowerCase().includes(search.toLowerCase()) ||
      p.mois?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: paiements.reduce((acc, p) => acc + p.montantTotal, 0),
    paye: paiements.reduce((acc, p) => acc + p.montantPaye, 0),
    impaye: paiements.reduce((acc, p) => acc + p.montantRestant, 0),
    count: {
      paye: paiements.filter(p => p.statut === "paye").length,
      partiel: paiements.filter(p => p.statut === "partiel").length,
      impaye: paiements.filter(p => p.statut === "impaye").length,
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>{t("loading")}...</p>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>{t("payments")}</h1>
          <Link
            to="/paiements/nouveau"
            style={{
              padding: "10px 20px",
              background: colors.primary,
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t("newPayment")}
          </Link>
        </div>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{t("managePayments")}</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isGestionnaire ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        {!isGestionnaire && (
          <StatCard
            label="Total attendu"
            value={`${stats.total.toLocaleString("fr-FR")} FCFA`}
            color={colors.primary}
            bg={colors.primaryBg}
            colors={colors}
          />
        )}
        <StatCard
          label={isGestionnaire ? "Payés" : "Total encaissé"}
          value={isGestionnaire ? `${stats.count.paye}` : `${stats.paye.toLocaleString("fr-FR")} FCFA`}
          color={colors.success}
          bg={colors.successBg}
          colors={colors}
        />
        <StatCard
          label={isGestionnaire ? "Partiels" : "Impayés"}
          value={isGestionnaire ? `${stats.count.partiel}` : `${stats.impaye.toLocaleString("fr-FR")} FCFA`}
          color={isGestionnaire ? colors.warning : colors.danger}
          bg={isGestionnaire ? colors.warningBg : colors.dangerBg}
          colors={colors}
        />
        <StatCard
          label={isGestionnaire ? "Impayés" : "Taux recouvrement"}
          value={isGestionnaire ? `${stats.count.impaye}` : `${stats.total > 0 ? Math.round((stats.paye / stats.total) * 100) : 0}%`}
          color={isGestionnaire ? colors.danger : colors.warning}
          bg={isGestionnaire ? colors.dangerBg : colors.warningBg}
          colors={colors}
        />
      </div>

      {/* Filters */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ position: "relative" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }}>
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un élève ou un mois..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "12px 12px 12px 44px",
                  border: `1px solid ${colors.border}`, borderRadius: 10,
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                  background: colors.bgInput, color: colors.text,
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "all", label: "Tous", count: paiements.length },
              { value: "paye", label: "Payés", count: stats.count.paye, color: colors.success },
              { value: "partiel", label: "Partiels", count: stats.count.partiel, color: colors.warning },
              { value: "impaye", label: "Impayés", count: stats.count.impaye, color: colors.danger },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                style={{
                  padding: "8px 16px", border: "1px solid",
                  borderColor: filter === f.value ? (f.color || colors.primary) : colors.border,
                  background: filter === f.value ? (f.color || colors.primary) + "20" : colors.bgCard,
                  borderRadius: 8, fontSize: 13, fontWeight: 500,
                  color: filter === f.value ? (f.color || colors.primary) : colors.textMuted,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {f.label}
                <span style={{
                  background: filter === f.value ? (f.color || colors.primary) : colors.border,
                  color: filter === f.value ? "#fff" : colors.textMuted,
                  padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {filteredPaiements.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun paiement trouvé</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <th style={thStyle}>Élève</th>
                <th style={thStyle}>Référence</th>
                <th style={thStyle}>Mois</th>
                <th style={thStyle}>Date</th>
                {!isGestionnaire && <th style={{ ...thStyle, textAlign: "right" }}>Total</th>}
                {!isGestionnaire && <th style={{ ...thStyle, textAlign: "right" }}>Payé</th>}
                {!isGestionnaire && <th style={{ ...thStyle, textAlign: "right" }}>Reste</th>}
                <th style={thStyle}>Saisi par</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Statut</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaiements.map((p, idx) => (
                <tr
                  key={p.id || idx}
                  style={{ borderTop: idx > 0 ? `1px solid ${colors.border}` : "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.bgHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: colors.primaryBg, color: colors.primary,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {p.eleveNom?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{p.eleveNom}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 12, color: colors.textMuted, fontFamily: "monospace" }}>
                    {p.reference || "—"}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 14, color: colors.text }}>{p.mois}</td>
                  <td style={{ padding: "16px 20px", fontSize: 14, color: colors.textMuted }}>{formatDate(p.datePaiement)}</td>
                  {!isGestionnaire && (
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 500, color: colors.text, textAlign: "right" }}>
                      {p.montantTotal.toLocaleString("fr-FR")} F
                    </td>
                  )}
                  {!isGestionnaire && (
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 500, color: colors.success, textAlign: "right" }}>
                      {p.montantPaye.toLocaleString("fr-FR")} F
                    </td>
                  )}
                  {!isGestionnaire && (
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 500, textAlign: "right", color: p.montantRestant > 0 ? colors.danger : colors.textMuted }}>
                      {p.montantRestant.toLocaleString("fr-FR")} F
                    </td>
                  )}
                  <td style={{ padding: "16px 20px", fontSize: 12, color: colors.textMuted }}>
                    {p.createdByName || "—"}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <StatusBadge statut={p.statut} colors={colors} />
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        to={`/eleves/${p.eleveId}`}
                        style={{
                          padding: "6px 12px", background: colors.bgSecondary,
                          color: colors.textMuted, borderRadius: 6,
                          textDecoration: "none", fontSize: 13, fontWeight: 500,
                        }}
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => void handleDownloadPDF(p)}
                        title="Télécharger le reçu PDF"
                        style={{
                          padding: "6px 12px", background: colors.primaryBg,
                          color: colors.primary, border: `1px solid ${colors.primary}30`,
                          borderRadius: 6, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Reçu PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 20px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

function StatCard({ label, value, color, bg, colors }: { label: string; value: string; color: string; bg: string; colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"] }) {
  return (
    <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 20 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
          <path d="M2 8H18" stroke={color} strokeWidth="1.5"/>
        </svg>
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>{value}</p>
    </div>
  );
}

function StatusBadge({ statut, colors }: { statut: "paye" | "partiel" | "impaye"; colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"] }) {
  const config = {
    paye:    { label: "Payé",    bg: colors.successBg, color: colors.success },
    partiel: { label: "Partiel", bg: colors.warningBg, color: colors.warning },
    impaye:  { label: "Impayé",  bg: colors.dangerBg,  color: colors.danger },
  };
  const { label, bg, color } = config[statut] || config.impaye;
  return (
    <span style={{ display: "inline-block", padding: "5px 12px", background: bg, color, borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  );
}
