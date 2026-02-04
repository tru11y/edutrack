import { useTheme } from "../../../context/ThemeContext";
import { ROLE_CONFIG } from "../../../constants";
import type { UserData } from "../types";

interface UserCardProps {
  user: UserData;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function UserCard({ user, canEdit, canDelete, onEdit, onResetPassword, onToggleStatus, onDelete }: UserCardProps) {
  const { colors } = useTheme();
  const roleConfig = ROLE_CONFIG[user.role];

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: roleConfig.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {(user.prenom?.[0] || user.email?.[0] || "?").toUpperCase()}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 500, color: colors.text }}>
            {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email?.split("@")[0] || "Inconnu"}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>{user.email || "Pas d'email"}</p>
          {user.role === "prof" && user.classesEnseignees && user.classesEnseignees.length > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.primary }}>{user.classesEnseignees.join(", ")}</p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "4px 12px",
            background: roleConfig.bg,
            color: roleConfig.color,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {roleConfig.label}
        </span>
        <span
          style={{
            padding: "4px 12px",
            background: user.isActive ? colors.successBg : colors.dangerBg,
            color: user.isActive ? colors.success : colors.danger,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {user.isActive ? "Actif" : "Inactif"}
        </span>
        {canEdit && (
          <button
            onClick={onEdit}
            style={{
              padding: "6px 12px",
              background: colors.primaryBg,
              color: colors.primary,
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Modifier
          </button>
        )}
        {canEdit && (
          <button
            onClick={onResetPassword}
            style={{
              padding: "6px 12px",
              background: colors.warningBg,
              color: colors.warning,
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reset MDP
          </button>
        )}
        {canEdit && (
          <button
            onClick={onToggleStatus}
            style={{
              padding: "6px 12px",
              background: user.isActive ? colors.warningBg : colors.successBg,
              color: user.isActive ? colors.warning : colors.success,
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {user.isActive ? "Desactiver" : "Activer"}
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            style={{
              padding: "6px 12px",
              background: colors.dangerBg,
              color: colors.danger,
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
