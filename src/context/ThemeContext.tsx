import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

// Couleurs du theme
export const themeColors = {
  light: {
    bg: "#f8fafc",
    bgSecondary: "#f1f5f9",
    bgCard: "#ffffff",
    bgHover: "#f1f5f9",
    bgInput: "#ffffff",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    text: "#1e293b",
    textSecondary: "#475569",
    textMuted: "#64748b",
    textLight: "#94a3b8",
    // Couleurs d'accent
    primary: "#6366f1",
    primaryBg: "#eef2ff",
    primaryHover: "#4f46e5",
    success: "#10b981",
    successBg: "#ecfdf5",
    warning: "#f59e0b",
    warningBg: "#fffbeb",
    danger: "#ef4444",
    dangerBg: "#fef2f2",
    info: "#3b82f6",
    infoBg: "#eff6ff",
  },
  dark: {
    bg: "#0f172a",
    bgSecondary: "#1e293b",
    bgCard: "#1e293b",
    bgHover: "#334155",
    bgInput: "#1e293b",
    border: "#334155",
    borderLight: "#475569",
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    textLight: "#64748b",
    // Couleurs d'accent (plus douces pour le mode sombre)
    primary: "#818cf8",
    primaryBg: "#312e81",
    primaryHover: "#6366f1",
    success: "#34d399",
    successBg: "#064e3b",
    warning: "#fbbf24",
    warningBg: "#78350f",
    danger: "#f87171",
    dangerBg: "#7f1d1d",
    info: "#60a5fa",
    infoBg: "#1e3a5f",
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: typeof themeColors.light;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  const colors = theme === "dark" ? themeColors.dark : themeColors.light;

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;
  }, [theme, colors]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark", colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
