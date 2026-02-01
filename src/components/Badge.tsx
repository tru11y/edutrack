import { useTheme } from "../context/ThemeContext";

export default function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "warning" | "danger";
}) {
  const { colors } = useTheme();

  const variantColors = {
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  };

  return (
    <span
      style={{
        background: variantColors[variant],
        color: "#fff",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
