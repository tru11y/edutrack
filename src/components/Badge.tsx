export default function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "warning" | "danger";
}) {
  const colors = {
    success: "#16a34a",
    warning: "#f59e0b",
    danger: "#dc2626",
  };

  return (
    <span
      style={{
        background: colors[variant],
        color: "white",
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
