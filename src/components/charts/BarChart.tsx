import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface BarChartDataset {
  label: string;
  data: number[];
  color?: string;
}

interface BarChartProps {
  labels: string[];
  datasets: BarChartDataset[];
  width?: number;
  height?: number;
  stacked?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  labels,
  datasets,
  width = 500,
  height = 250,
  stacked = false,
}) => {
  const { colors } = useTheme();
  const defaultColors = [colors.primary, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute max value
  let maxVal = 0;
  if (stacked) {
    for (let i = 0; i < labels.length; i++) {
      const sum = datasets.reduce((acc, ds) => acc + (ds.data[i] || 0), 0);
      maxVal = Math.max(maxVal, sum);
    }
  } else {
    maxVal = Math.max(1, ...datasets.flatMap((d) => d.data));
  }

  const groupWidth = chartW / labels.length;
  const barGap = 4;
  const groupPadding = groupWidth * 0.2;
  const barWidth = stacked
    ? groupWidth - groupPadding * 2
    : (groupWidth - groupPadding * 2 - barGap * (datasets.length - 1)) / datasets.length;

  const getY = (v: number) => chartH - (v / maxVal) * chartH;
  const getBarHeight = (v: number) => (v / maxVal) * chartH;

  // Grid lines
  const gridLines = 5;
  const gridStep = maxVal / gridLines;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const val = i * gridStep;
          const y = padding.top + getY(val);
          return (
            <g key={`grid-${i}`}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={colors.border} strokeDasharray="4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill={colors.textMuted} fontSize={11}>
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {labels.map((label, li) => {
          const groupX = padding.left + li * groupWidth + groupPadding;

          if (stacked) {
            let cumulativeHeight = 0;
            return (
              <g key={li}>
                {datasets.map((ds, di) => {
                  const val = ds.data[li] || 0;
                  const bh = getBarHeight(val);
                  const by = padding.top + getY(cumulativeHeight + val);
                  cumulativeHeight += val;
                  const bColor = ds.color || defaultColors[di % defaultColors.length];
                  return (
                    <rect key={di} x={groupX} y={by} width={barWidth} height={bh} rx={3} fill={bColor}>
                      <title>{`${ds.label}: ${val}`}</title>
                    </rect>
                  );
                })}
                <text
                  x={groupX + barWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fill={colors.textMuted}
                  fontSize={11}
                >
                  {label}
                </text>
              </g>
            );
          }

          return (
            <g key={li}>
              {datasets.map((ds, di) => {
                const val = ds.data[li] || 0;
                const bh = getBarHeight(val);
                const bx = groupX + di * (barWidth + barGap);
                const by = padding.top + getY(val);
                const bColor = ds.color || defaultColors[di % defaultColors.length];
                return (
                  <rect key={di} x={bx} y={by} width={barWidth} height={bh} rx={3} fill={bColor}>
                    <title>{`${ds.label}: ${val}`}</title>
                  </rect>
                );
              })}
              <text
                x={groupX + ((barWidth + barGap) * datasets.length - barGap) / 2}
                y={height - 8}
                textAnchor="middle"
                fill={colors.textMuted}
                fontSize={11}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {datasets.length > 1 &&
          datasets.map((ds, i) => {
            const lx = padding.left + i * 120;
            const ly = 12;
            const lColor = ds.color || defaultColors[i % defaultColors.length];
            return (
              <g key={`legend-${i}`}>
                <rect x={lx} y={ly - 6} width={12} height={12} rx={3} fill={lColor} />
                <text x={lx + 16} y={ly + 4} fill={colors.textMuted} fontSize={11}>
                  {ds.label}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
};

export default BarChart;
