export default function PageHeader({ title, subtitle, action }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--muted)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
