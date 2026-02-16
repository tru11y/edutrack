import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  getBulletinVersionsSecure,
  compareBulletinVersionsSecure,
  type BulletinVersion,
  type VersionDiff,
} from "../../services/cloudFunctions";

interface Props {
  bulletinId: string;
  onClose: () => void;
}

export default function BulletinVersionHistory({ bulletinId, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [versions, setVersions] = useState<BulletinVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [diff, setDiff] = useState<VersionDiff[] | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    getBulletinVersionsSecure(bulletinId)
      .then((res) => setVersions(res.versions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bulletinId]);

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return;
    setComparing(true);
    try {
      const res = await compareBulletinVersionsSecure(bulletinId, selectedA, selectedB);
      setDiff(res.diff);
    } catch {
      setDiff(null);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "relative", background: colors.bgCard, borderRadius: 16,
        border: `1px solid ${colors.border}`, padding: 24, width: 600, maxWidth: "90vw",
        maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
            {t("versionHistory")}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 20 }}>
            &times;
          </button>
        </div>

        {loading ? (
          <p style={{ color: colors.textMuted, textAlign: "center", padding: 32 }}>Chargement...</p>
        ) : versions.length === 0 ? (
          <p style={{ color: colors.textMuted, textAlign: "center", padding: 32 }}>Aucune version precedente.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {versions.map((v) => (
                <div key={v.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  background: (selectedA === v.id || selectedB === v.id) ? colors.primaryBg : colors.bgHover,
                  borderRadius: 10, border: `1px solid ${colors.border}`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>
                    v{v.versionNumber}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: colors.textMuted }}>
                    Moy: {v.data?.moyenneGenerale ?? "—"} | {v.createdAt ? new Date(v.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setSelectedA(v.id)}
                      style={{
                        padding: "4px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
                        background: selectedA === v.id ? colors.primary : colors.bgCard,
                        color: selectedA === v.id ? "#fff" : colors.textMuted,
                        fontSize: 11, cursor: "pointer",
                      }}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setSelectedB(v.id)}
                      style={{
                        padding: "4px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
                        background: selectedB === v.id ? colors.primary : colors.bgCard,
                        color: selectedB === v.id ? "#fff" : colors.textMuted,
                        fontSize: 11, cursor: "pointer",
                      }}
                    >
                      B
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedA && selectedB && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                style={{
                  padding: "10px 20px", background: colors.primary, color: "#fff",
                  borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500,
                  cursor: comparing ? "not-allowed" : "pointer", width: "100%", marginBottom: 16,
                }}
              >
                {comparing ? "..." : t("compareVersions")}
              </button>
            )}

            {diff && (
              <div style={{ marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: colors.textMuted }}>Matiere</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Version A</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Version B</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.map((d) => (
                      <tr key={d.matiere} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "8px 12px", fontSize: 14, color: colors.text }}>{d.matiere}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 14, color: colors.textMuted }}>{d.noteA ?? "—"}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 14, color: colors.textMuted }}>{d.noteB ?? "—"}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 14, fontWeight: 600,
                          color: d.change === null ? colors.textMuted : d.change > 0 ? colors.success : d.change < 0 ? colors.danger : colors.textMuted,
                        }}>
                          {d.change === null ? "—" : d.change > 0 ? `+${d.change}` : d.change}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
