import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/ui";
import { getAuditLogsSecure, getCloudFunctionErrorMessage, type AuditLog } from "../services/cloudFunctions";

const ACTION_COLORS: Record<string, string> = {
  create: "#10b981",
  delete: "#ef4444",
  toggle: "#f59e0b",
  update: "#3b82f6",
  login: "#8b5cf6",
};

export default function AuditLogs() {
  const { colors } = useTheme();
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAuditLogsSecure(500);
        setLogs(res.logs);
      } catch (err) {
        toast.error(getCloudFunctionErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const actionTypes = [...new Set(logs.map((l) => l.action))].sort();

  const filtered = logs.filter((l) => {
    if (filterAction && l.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        (l.targetEmail || "").toLowerCase().includes(q) ||
        l.performedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const inputStyle = {
    padding: "10px 14px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    outline: "none",
  };

  if (loading) return <div style={{ padding: 32, color: colors.text }}>Chargement...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Journal d'audit</h1>
        <p style={{ color: colors.textMuted, margin: "4px 0 0", fontSize: 14 }}>{filtered.length} entree{filtered.length > 1 ? "s" : ""}</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          style={{ ...inputStyle, minWidth: 200 }}
        />
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
          <option value="">Toutes les actions</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: colors.bgSecondary }}>
            <tr>
              {["Date", "Action", "Cible", "Effectue par"].map((h) => (
                <th key={h} style={{ padding: 12, textAlign: "left", color: colors.textSecondary, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: colors.textMuted }}>Aucun log.</td></tr>
            )}
            {filtered.map((l, idx) => {
              const actionColor = Object.entries(ACTION_COLORS).find(([k]) => l.action.toLowerCase().includes(k))?.[1] || "#6b7280";
              return (
                <tr key={l.id} style={{ borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13 }}>
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${actionColor}18`,
                      color: actionColor,
                    }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: colors.text, fontSize: 13 }}>{l.targetEmail || l.targetUserId || "-"}</td>
                  <td style={{ padding: 12, color: colors.textMuted, fontSize: 13 }}>{l.performedBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
