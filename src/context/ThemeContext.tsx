import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
    bgHover: "#f8fafc",
    bgInput: "#ffffff",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    text: "#0f172a",
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
    onGradientMuted: "rgba(255,255,255,0.75)",
    onGradientOverlay: "rgba(255,255,255,0.18)",
    shadowPrimary: "0 4px 14px -3px rgba(99, 102, 241, 0.35)",
    // Shadow tokens
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    shadowCard: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
    shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  },
  dark: {
    bg: "#0d1421",
    bgSecondary: "#161e2e",
    bgCard: "#1a2332",
    bgHover: "#1e2a3a",
    bgInput: "#161e2e",
    border: "#2a3a4a",
    borderLight: "#223040",
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#8899aa",
    textLight: "#4a6075",
    // Couleurs d'accent (overridden dynamically)
    primary: "#818cf8",
    primaryBg: "#1e2160",
    primaryHover: "#6366f1",
    success: "#34d399",
    successBg: "#052e1c",
    warning: "#fbbf24",
    warningBg: "#3d2000",
    danger: "#f87171",
    dangerBg: "#3f0d0d",
    info: "#60a5fa",
    infoBg: "#0f2744",
    // Gradients & gendered colors (dark mode)
    gradientPrimary: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
    gradientMale: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
    gradientFemale: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
    maleBg: "#0f2744",
    maleText: "#60a5fa",
    femaleBg: "#2d0f24",
    femaleText: "#f472b6",
    onGradient: "#ffffff",
    onGradientMuted: "rgba(255,255,255,0.75)",
    onGradientOverlay: "rgba(255,255,255,0.12)",
    shadowPrimary: "0 4px 14px -3px rgba(129, 140, 248, 0.35)",
    // Shadow tokens (darker for dark mode)
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.2)",
    shadowCard: "0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.2)",
    shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
    shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.2)",
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

  const colors = useMemo(() => {
    const base = theme === "dark" ? themeColors.dark : themeColors.light;
    const darker = darkenHex(primaryColor, 0.75);
    return {
      ...base,
      primary: primaryColor,
      primaryBg: `${primaryColor}1a`,
      primaryHover: darkenHex(primaryColor, 0.85),
      gradientPrimary: `linear-gradient(135deg, ${primaryColor} 0%, ${darker} 100%)`,
      shadowPrimary: `0 4px 14px -3px ${primaryColor}66`,
    };
  }, [theme, primaryColor]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;
  }, [theme, colors]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  const value = useMemo(
    () => ({ theme, toggleTheme, isDark: theme === "dark", colors, primaryColor, setPrimaryColor }),
    [theme, toggleTheme, colors, primaryColor]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
