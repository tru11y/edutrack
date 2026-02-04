import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, children, action, icon }: PageHeaderProps) {
  const { colors } = useTheme();

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: colors.primaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.primary,
            }}
          >
            {icon}
          </div>
        )}
        <div>
          {title && <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>{title}</h1>}
          {subtitle && <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{subtitle}</p>}
          {children}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;
