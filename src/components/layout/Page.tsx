import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Page({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <div
      className="min-h-screen px-8 py-6"
      style={{ background: colors.bg }}
    >
      {children}
    </div>
  );
}
