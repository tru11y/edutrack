import { useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import type { DashboardWidget } from "../hooks/useDashboardWidgets";

interface Props {
  widgets: DashboardWidget[];
  onToggle: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function DashboardWidgetConfig({ widgets, onToggle, onReorder, onReset, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "relative", background: colors.bgCard, borderRadius: 16,
        border: `1px solid ${colors.border}`, padding: 24, width: 400, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
            {t("widgetConfig")}
          </h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 20,
          }}>
            &times;
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); dragOverIndex.current = index; }}
              onDrop={() => {
                if (dragIndex !== null && dragOverIndex.current !== null && dragIndex !== dragOverIndex.current) {
                  onReorder(dragIndex, dragOverIndex.current);
                }
                setDragIndex(null);
                dragOverIndex.current = null;
              }}
              onDragEnd={() => setDragIndex(null)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: dragIndex === index ? colors.primaryBg : colors.bgHover,
                borderRadius: 10, cursor: "grab", border: `1px solid ${colors.border}`,
                opacity: dragIndex === index ? 0.6 : 1,
              }}
            >
              <span style={{ color: colors.textMuted, fontSize: 16, cursor: "grab" }}>&#x2630;</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: colors.text }}>
                {widget.label}
              </span>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={widget.visible}
                  onChange={() => onToggle(widget.id)}
                  style={{ width: 18, height: 18, cursor: "pointer", accentColor: colors.primary }}
                />
                <span style={{ marginLeft: 6, fontSize: 12, color: colors.textMuted }}>
                  {widget.visible ? t("showWidget") : t("hideWidget")}
                </span>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={onReset}
          style={{
            width: "100%", padding: "10px", background: colors.bgSecondary,
            border: `1px solid ${colors.border}`, borderRadius: 8,
            fontSize: 13, color: colors.textMuted, cursor: "pointer",
          }}
        >
          {t("resetWidgets")}
        </button>
      </div>
    </div>
  );
}
