import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import type { OnboardingStep } from "./onboarding.config";

interface Props {
  steps: OnboardingStep[];
  onComplete: () => void;
}

export default function OnboardingTour({ steps, onComplete }: Props) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    updateTargetRect();
    const interval = setInterval(updateTargetRect, 500);
    return () => clearInterval(interval);
  }, [updateTargetRect]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onComplete();
      if (e.key === "ArrowRight" && !isLast) setCurrentStep((s) => s + 1);
      if (e.key === "ArrowLeft" && currentStep > 0) setCurrentStep((s) => s - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentStep, isLast, onComplete]);

  if (!step) return null;

  const padding = 8;
  const title = language === "en" ? step.titleEn : step.titleFr;
  const description = language === "en" ? step.descriptionEn : step.descriptionFr;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const style: React.CSSProperties = { position: "fixed" };

    switch (step.position) {
      case "right":
        style.left = targetRect.right + 16;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = "translateY(-50%)";
        break;
      case "left":
        style.right = window.innerWidth - targetRect.left + 16;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = "translateY(-50%)";
        break;
      case "bottom":
        style.left = targetRect.left + targetRect.width / 2;
        style.top = targetRect.bottom + 16;
        style.transform = "translateX(-50%)";
        break;
      case "top":
        style.left = targetRect.left + targetRect.width / 2;
        style.bottom = window.innerHeight - targetRect.top + 16;
        style.transform = "translateX(-50%)";
        break;
    }

    return style;
  };

  // Spotlight using box-shadow
  const spotlightStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: targetRect.top - padding,
        left: targetRect.left - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        borderRadius: 12,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
        zIndex: 9999,
        pointerEvents: "none",
        transition: "all 0.3s ease",
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        pointerEvents: "none",
      };

  return (
    <>
      {/* Overlay that captures clicks */}
      <div
        onClick={onComplete}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          cursor: "pointer",
        }}
      />

      {/* Spotlight cutout */}
      <div style={spotlightStyle} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          ...getTooltipStyle(),
          position: "fixed",
          zIndex: 10000,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: 20,
          width: 300,
          boxShadow: `0 8px 32px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= currentStep ? colors.primary : colors.border,
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 18px", lineHeight: 1.5 }}>
          {description}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={onComplete}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: colors.textMuted, padding: "6px 0",
            }}
          >
            {language === "en" ? "Skip" : "Passer"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                style={{
                  padding: "8px 16px", background: colors.bgSecondary,
                  border: `1px solid ${colors.border}`, borderRadius: 8,
                  fontSize: 13, color: colors.text, cursor: "pointer",
                }}
              >
                {language === "en" ? "Back" : "Retour"}
              </button>
            )}
            <button
              onClick={() => isLast ? onComplete() : setCurrentStep((s) => s + 1)}
              style={{
                padding: "8px 20px",
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                color: colors.onGradient, border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {isLast
                ? (language === "en" ? "Done" : "Terminer")
                : (language === "en" ? "Next" : "Suivant")}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: colors.textMuted, margin: "12px 0 0", textAlign: "center" }}>
          {currentStep + 1} / {steps.length}
        </p>
      </div>
    </>
  );
}
