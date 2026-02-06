import { Component, type ReactNode } from "react";
import { themeColors } from "../context/ThemeContext";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const colors = isDark ? themeColors.dark : themeColors.light;

    return (
      <div style={{ padding: 40, textAlign: "center", background: colors.bg, minHeight: "100vh" }}>
        <div style={{
          maxWidth: 500, margin: "0 auto", background: colors.bgCard,
          borderRadius: 16, padding: 32,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: colors.dangerBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>
            Une erreur est survenue
          </h2>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: "0 0 16px" }}>
            {this.state.error?.message || "Erreur inconnue"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px", background: colors.primary, color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontSize: 14, fontWeight: 500,
            }}
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}
