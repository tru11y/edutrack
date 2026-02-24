import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "#6366f1").replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 99 : r, isNaN(g) ? 102 : g, isNaN(b) ? 241 : b];
}

function darkenHex(hex: string, factor = 0.85): string {
  const [r, g, b] = hexToRgb(hex);
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n * factor)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
    // Couleurs d'accent (overridden dynamically)
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
    // Gradients & gendered colors
    gradientPrimary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    gradientMale: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    gradientFemale: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    maleBg: "#dbeafe",
    maleText: "#3b82f6",
    femaleBg: "#fce7f3",
    femaleText: "#ec4899",
    onGradient: "#ffffff",
    onGradientMuted: "rgba(255,255,255,0.8)",
    onGradientOverlay: "rgba(255,255,255,0.2)",
    shadowPrimary: "0 4px 14px -3px rgba(99, 102, 241, 0.4)",
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
    // Couleurs d'accent (plus douces pour le mode sombre, overridden dynamically)
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
    // Gradients & gendered colors (dark mode)
    gradientPrimary: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
    gradientMale: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
    gradientFemale: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
    maleBg: "#1e3a5f",
    maleText: "#60a5fa",
    femaleBg: "#4a1942",
    femaleText: "#f472b6",
    onGradient: "#ffffff",
    onGradientMuted: "rgba(255,255,255,0.8)",
    onGradientOverlay: "rgba(255,255,255,0.2)",
    shadowPrimary: "0 4px 14px -3px rgba(129, 140, 248, 0.4)",
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: typeof themeColors.light;
  primaryColor: string;
  setPrimaryColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  const [primaryColor, setPrimaryColor] = useState("#6366f1");

  const base = theme === "dark" ? themeColors.dark : themeColors.light;
  const darker = darkenHex(primaryColor, 0.75);
  const colors = {
    ...base,
    primary: primaryColor,
    primaryBg: `${primaryColor}1a`,
    primaryHover: darkenHex(primaryColor, 0.85),
    gradientPrimary: `linear-gradient(135deg, ${primaryColor} 0%, ${darker} 100%)`,
    shadowPrimary: `0 4px 14px -3px ${primaryColor}66`,
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;
  }, [theme, colors]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark", colors, primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
