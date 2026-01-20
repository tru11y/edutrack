export default function Badge({ label, type }: any) {
  const map: any = {
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };

  return (
    <span style={{
      background: map[type],
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
