import React from "react";
import { useTheme } from "../../context/ThemeContext";

type Variant = "primary" | "secondary" | "danger";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  children,
  variant = "primary",
  style,
  ...props
}: Props) {
  const { colors } = useTheme();

  const baseStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 8,
    fontWeight: 500,
    transition: "all 0.2s",
    border: "none",
    cursor: props.disabled ? "not-allowed" : "pointer",
    opacity: props.disabled ? 0.5 : 1,
  };

  const variantStyles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: colors.primary,
      color: "#fff",
    },
    secondary: {
      background: colors.bgSecondary,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    danger: {
      background: colors.danger,
      color: "#fff",
    },
  };

  return (
    <button
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
