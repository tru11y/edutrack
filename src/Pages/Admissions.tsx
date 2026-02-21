import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { callFunction } from "../services/cloudFunctions";

interface Admission {
  id: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  parentNom: string;
  parentEmail: string;
  statut: string;
  createdAt: string | null;
  rejectReason?: string;
}

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  nouveau: { bg: "#dbeafe", text: "#1d4ed8" },
  en_revue: { bg: "#fef3c7", text: "#b45309" },
  accepte: { bg: "#d1fae5", text: "#065f46" },
  refuse: { bg: "#fee2e2", text: "#991b1b" },
};

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_revue: "En revue",
  accepte: "Accepte",
  refuse: "Refuse",
};

export default function Admissions() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadAdmissions = useCallback(async () => {
    try {
      const res = await callFunction<{ admissions: Admission[] }>("listAdmissions", { statut: filter || undefined });
      setAdmissions(res.admissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadAdmissions(); }, [loadAdmissions]);

  const handleUpdate = async (id: string, statut: string, rejectReason?: string) => {
    setUpdating(id);
    try {
      await callFunction("updateAdmission", { id, statut, rejectReason });
      loadAdmissions();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>{t("admissions") || "Admissions"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["", "nouveau", "en_revue", "accepte", "refuse"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: filter === s ? "#6366f1" : colors.cardBg, color: filter === s ? "#fff" : colors.textSecondary,
            }}>
              {s ? STATUT_LABELS[s] : "Tous"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: colors.textSecondary }}>Chargement...</p>
      ) : admissions.length === 0 ? (
        <p style={{ color: colors.textSecondary }}>Aucune candidature trouvee.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {admissions.map((adm) => {
            const sc = STATUT_COLORS[adm.statut] || STATUT_COLORS.nouveau;
            return (
              <div key={adm.id} style={{
                background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>
                      {adm.elevePrenom} {adm.eleveNom}
                    </h3>
                    <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
                      Classe: {adm.classe} | Parent: {adm.parentNom} ({adm.parentEmail})
                    </p>
                    {adm.createdAt && (
                      <p style={{ fontSize: 12, color: colors.textSecondary, margin: "4px 0 0" }}>
                        Soumis le {new Date(adm.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: sc.bg, color: sc.text,
                  }}>
                    {STATUT_LABELS[adm.statut]}
                  </span>
                </div>

                {adm.statut === "nouveau" || adm.statut === "en_revue" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {adm.statut === "nouveau" && (
                      <button onClick={() => handleUpdate(adm.id, "en_revue")} disabled={updating === adm.id}
                        style={{ padding: "6px 14px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                        Mettre en revue
                      </button>
                    )}
                    <button onClick={() => handleUpdate(adm.id, "accepte")} disabled={updating === adm.id}
                      style={{ padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                      Accepter
                    </button>
                    <button onClick={() => {
                      const reason = prompt("Motif du refus:");
                      if (reason) handleUpdate(adm.id, "refuse", reason);
                    }} disabled={updating === adm.id}
                      style={{ padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                      Refuser
                    </button>
                  </div>
                ) : adm.statut === "refuse" && adm.rejectReason ? (
                  <p style={{ fontSize: 13, color: "#991b1b", margin: 0 }}>Motif: {adm.rejectReason}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
