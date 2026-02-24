import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTenant } from "../context/TenantContext";

interface LogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityLabel?: string;
  details?: string;
  timestamp: Timestamp | null;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  login: "Connexion",
  export: "Export",
  import: "Import",
  payment_add: "Paiement ajouté",
  payment_delete: "Paiement supprimé",
  presence_mark: "Présence marquée",
  user_activate: "Compte activé",
  user_deactivate: "Compte désactivé",
  password_reset: "Réinitialisation MdP",
};

const ENTITY_LABELS: Record<string, string> = {
  eleve: "Élève",
  user: "Utilisateur",
  paiement: "Paiement",
  presence: "Présence",
  cahier: "Cahier de texte",
  depense: "Dépense",
  salaire: "Salaire",
  evaluation: "Évaluation",
  classe: "Classe",
  matiere: "Matière",
  emploi_du_temps: "Emploi du temps",
  discipline: "Discipline",
  school_settings: "Paramètres école",
};

const ACTION_COLORS: Record<string, string> = {
  create: "#16a34a",
  update: "#2563eb",
  delete: "#dc2626",
  login: "#7c3aed",
  export: "#0891b2",
  import: "#0891b2",
  payment_add: "#16a34a",
  payment_delete: "#dc2626",
  presence_mark: "#d97706",
  user_activate: "#16a34a",
  user_deactivate: "#dc2626",
  password_reset: "#7c3aed",
};

function formatTs(ts: Timestamp | null): string {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function ActivityLogs() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "activity_logs"),
        orderBy("timestamp", "desc"),
        limit(200)
      );

      if (schoolId) {
        q = query(
          collection(db, "activity_logs"),
          where("schoolId", "==", schoolId),
          orderBy("timestamp", "desc"),
          limit(200)
        );
      }

      const snap = await getDocs(q);
      setLogs(
        snap.docs.map((d) => ({
          id: d.id,
          actorName: d.data().actorName || "Inconnu",
          actorRole: d.data().actorRole || "",
          action: d.data().action || "",
          entity: d.data().entity || "",
          entityLabel: d.data().entityLabel,
          details: d.data().details,
          timestamp: d.data().timestamp || null,
        }))
      );
    } catch (err) {
      console.error("ActivityLogs fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (!user || (user.role !== "admin" && user.role !== "gestionnaire")) {
    return null;
  }

  const filtered = logs.filter((l) => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterEntity && l.entity !== filterEntity) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 12,
              background: colors.primaryBg, display: "flex",
              alignItems: "center", justifyContent: "center", color: colors.primary,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: colors.text, margin: 0 }}>
              Journal d'activité
            </h1>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
              Historique de toutes les actions effectuées dans l'application
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap",
          background: colors.bgCard, borderRadius: 12,
          border: `1px solid ${colors.border}`, padding: 16,
        }}
      >
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{
            padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
            fontSize: 13, background: colors.bgInput, color: colors.text,
          }}
        >
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          style={{
            padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
            fontSize: 13, background: colors.bgInput, color: colors.text,
          }}
        >
          <option value="">Toutes les entités</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button
          onClick={fetchLogs}
          style={{
            padding: "10px 16px", background: colors.primaryBg, color: colors.primary,
            border: `1px solid ${colors.primary}40`, borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Actualiser
        </button>

        <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 13, color: colors.textMuted }}>
          {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: colors.bgCard, borderRadius: 12,
          border: `1px solid ${colors.border}`, overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontSize: 14 }}>
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontSize: 14 }}>
            Aucune activité enregistrée
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: colors.textMuted }}>Date & heure</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: colors.textMuted }}>Utilisateur</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: colors.textMuted }}>Action</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: colors.textMuted }}>Entité</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: colors.textMuted }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      background: i % 2 === 0 ? "transparent" : `${colors.bgSecondary}80`,
                    }}
                  >
                    <td style={{ padding: "10px 16px", color: colors.textMuted, whiteSpace: "nowrap" }}>
                      {formatTs(log.timestamp)}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: 600, color: colors.text }}>{log.actorName}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "capitalize" }}>
                        {log.actorRole}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: `${ACTION_COLORS[log.action] || "#6366f1"}1a`,
                          color: ACTION_COLORS[log.action] || "#6366f1",
                        }}
                      >
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: colors.text }}>
                      {ENTITY_LABELS[log.entity] || log.entity}
                      {log.entityLabel && (
                        <span style={{ marginLeft: 6, color: colors.textMuted, fontSize: 12 }}>
                          — {log.entityLabel}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", color: colors.textMuted, maxWidth: 240 }}>
                      {log.details || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
