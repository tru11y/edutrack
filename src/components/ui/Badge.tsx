type BadgeType = "success" | "warning" | "danger";

interface BadgeProps {
  label: string;
  type: BadgeType;
}

const colorMap: Record<BadgeType, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

export default function Badge({ label, type }: BadgeProps) {
  return (
    <span style={{
      background: colorMap[type],
      color: "#fff",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
}
