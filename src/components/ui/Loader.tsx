export default function Loader({ label = "Chargement…" }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: "center",
        color: "var(--muted)",
      }}
    >
      {label}
    </div>
  );
}
