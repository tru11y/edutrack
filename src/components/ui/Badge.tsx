import { useTheme } from "../../context/ThemeContext";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "primary" | "secondary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

/**
 * Composant Badge unifie
 * Remplace les anciennes versions dupliquees
 */
export function Badge({ children, variant = "primary", size = "sm" }: BadgeProps) {
  const { colors } = useTheme();

  const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
    success: { bg: colors.successBg, color: colors.success },
    warning: { bg: colors.warningBg, color: colors.warning },
    danger: { bg: colors.dangerBg, color: colors.danger },
    info: { bg: colors.infoBg, color: colors.info },
    primary: { bg: colors.primaryBg, color: colors.primary },
    secondary: { bg: colors.bgSecondary, color: colors.textMuted },
  };

  const sizeStyles = {
    sm: { padding: "4px 10px", fontSize: 12 },
    md: { padding: "6px 14px", fontSize: 13 },
  };

  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: style.bg,
        color: style.color,
        padding: sizeStyle.padding,
        borderRadius: 999,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// Export default pour compatibilite avec les anciens imports
export default Badge;
