import React from "react";

export default function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}
