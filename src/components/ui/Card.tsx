import type { ReactNode, CSSProperties } from "react";
import { useTheme } from "../../context/ThemeContext";

interface CardProps {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

const paddingMap = {
  none: 0,
  sm: 12,
  md: 20,
  lg: 32,
};

export default function Card({
  children,
  padding = "md",
  hover = false,
  onClick,
  style,
}: CardProps) {
  const { colors } = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: paddingMap[padding],
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = colors.borderLight;
        }
      }}
      onMouseLeave={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      {children}
    </div>
  );
}

// Card pour les statistiques
interface StatCardProps {
  label: string;
  value: number | string;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
}

export function StatCard({ label, value, color = "primary", icon }: StatCardProps) {
  const { colors } = useTheme();

  const colorMap = {
    primary: { bg: colors.primaryBg, border: colors.primary + "40", text: colors.primary, value: colors.primaryHover },
    success: { bg: colors.successBg, border: colors.success + "40", text: colors.success, value: "#059669" },
    warning: { bg: colors.warningBg, border: colors.warning + "40", text: colors.warning, value: "#b45309" },
    danger: { bg: colors.dangerBg, border: colors.danger + "40", text: colors.danger, value: "#dc2626" },
    info: { bg: colors.infoBg, border: colors.info + "40", text: colors.info, value: "#1d4ed8" },
  };

  const colorStyle = colorMap[color];

  return (
    <div
      style={{
        background: colorStyle.bg,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${colorStyle.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 13, color: colorStyle.text, margin: 0 }}>{label}</p>
        {icon && <div style={{ color: colorStyle.text }}>{icon}</div>}
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: colorStyle.value, margin: 0 }}>{value}</p>
    </div>
  );
}

// Card pour les actions rapides
interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
}

export function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  const { colors } = useTheme();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        padding: 16,
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.style.background = colors.primaryBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.background = colors.bgCard;
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: colors.primaryBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.primary,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 500, color: colors.text, fontSize: 15 }}>{title}</p>
        {description && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>{description}</p>
        )}
      </div>
    </button>
  );
}
