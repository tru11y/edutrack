import React from "react";

type Variant = "primary" | "secondary" | "danger";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  children,
  variant = "primary",
  ...props
}: Props) {
  const base =
    "px-4 py-2 rounded font-medium transition disabled:opacity-50";

  const styles: Record<Variant, string> = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button className={`${base} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
}
