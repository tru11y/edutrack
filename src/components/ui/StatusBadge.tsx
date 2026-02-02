import { useTheme } from "../../context/ThemeContext";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "primary";
type BadgeSize = "sm" | "md";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export default function StatusBadge({
  children,
  variant = "default",
  size = "md",
  dot = false,
}: StatusBadgeProps) {
  const { colors } = useTheme();

  const variantStyles: Record<BadgeVariant, { bg: string; color: string; dotColor: string }> = {
    default: { bg: colors.bgSecondary, color: colors.textMuted, dotColor: colors.textMuted },
    success: { bg: colors.successBg, color: colors.success, dotColor: colors.success },
    warning: { bg: colors.warningBg, color: colors.warning, dotColor: colors.warning },
    danger: { bg: colors.dangerBg, color: colors.danger, dotColor: colors.danger },
    info: { bg: colors.infoBg, color: colors.info, dotColor: colors.info },
    primary: { bg: colors.primaryBg, color: colors.primary, dotColor: colors.primary },
  };

  const sizeStyles: Record<BadgeSize, { padding: string; fontSize: number; dotSize: number }> = {
    sm: { padding: "2px 8px", fontSize: 11, dotSize: 6 },
    md: { padding: "4px 12px", fontSize: 12, dotSize: 8 },
  };

  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: sizeStyle.padding,
        background: style.bg,
        color: style.color,
        borderRadius: 20,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: sizeStyle.dotSize,
            height: sizeStyle.dotSize,
            borderRadius: "50%",
            background: style.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// Badges pre-configures pour les cas d'usage courants
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge variant={isActive ? "success" : "danger"} dot>
      {isActive ? "Actif" : "Inactif"}
    </StatusBadge>
  );
}

export function RoleBadge({ role }: { role: "admin" | "gestionnaire" | "prof" }) {
  const roleConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    admin: { label: "Admin", variant: "primary" },
    gestionnaire: { label: "Gestionnaire", variant: "warning" },
    prof: { label: "Prof", variant: "success" },
  };

  const config = roleConfig[role] || { label: role, variant: "default" as BadgeVariant };

  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}

export function PresenceBadge({ status }: { status: "present" | "absent" | "retard" }) {
  const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    present: { label: "Present", variant: "success" },
    absent: { label: "Absent", variant: "danger" },
    retard: { label: "Retard", variant: "warning" },
  };

  const config = statusConfig[status] || { label: status, variant: "default" as BadgeVariant };

  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}
