import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  sublabel,
}) => {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor = color || colors.primary;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.8s ease-in-out",
          }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={colors.text}
          fontSize={size * 0.2}
          fontWeight="bold"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      {label && (
        <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{label}</span>
      )}
      {sublabel && (
        <span style={{ color: colors.textMuted, fontSize: 12 }}>{sublabel}</span>
      )}
    </div>
  );
};

export default CircularProgress;
