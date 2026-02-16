import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface LineChartDataset {
  label: string;
  data: number[];
  color?: string;
}

interface LineChartProps {
  labels: string[];
  datasets: LineChartDataset[];
  width?: number;
  height?: number;
  showDots?: boolean;
  showGrid?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  labels,
  datasets,
  width = 500,
  height = 250,
  showDots = true,
  showGrid = true,
}) => {
  const { colors } = useTheme();
  const defaultColors = [colors.primary, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute min/max across all datasets
  const allValues = datasets.flatMap((d) => d.data);
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(1, ...allValues);
  const range = maxVal - minVal || 1;

  const getX = (i: number) => padding.left + (i / Math.max(1, labels.length - 1)) * chartW;
  const getY = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH;

  // Grid lines
  const gridLines = 5;
  const gridStep = range / gridLines;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid */}
        {showGrid &&
          Array.from({ length: gridLines + 1 }).map((_, i) => {
            const val = minVal + i * gridStep;
            const y = getY(val);
            return (
              <g key={`grid-${i}`}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={colors.border} strokeDasharray="4" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill={colors.textMuted} fontSize={11}>
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

        {/* Datasets */}
        {datasets.map((dataset, di) => {
          const lineColor = dataset.color || defaultColors[di % defaultColors.length];
          const points = dataset.data.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");

          return (
            <g key={di}>
              <polyline fill="none" stroke={lineColor} strokeWidth={2.5} points={points} strokeLinejoin="round" strokeLinecap="round" />
              {showDots &&
                dataset.data.map((v, i) => (
                  <circle key={i} cx={getX(i)} cy={getY(v)} r={4} fill={lineColor} stroke={colors.bgCard} strokeWidth={2} />
                ))}
            </g>
          );
        })}

        {/* X labels */}
        {labels.map((label, i) => (
          <text key={i} x={getX(i)} y={height - 8} textAnchor="middle" fill={colors.textMuted} fontSize={11}>
            {label}
          </text>
        ))}

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

export default LineChart;
