import type { ReactNode, CSSProperties } from "react";
import { useTheme } from "../../context/ThemeContext";

interface TableProps {
  headers?: string[];
  children: ReactNode;
  style?: CSSProperties;
}

export function Table({ headers, children, style }: TableProps) {
  const { colors } = useTheme();

  return (
    <div style={{ overflowX: "auto", ...style }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: colors.bgCard,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {headers && (
          <thead style={{ background: colors.bgSecondary }}>
            <tr>
              {headers.map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface ThProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  style?: CSSProperties;
}

export function Th({ children, align = "left", style }: ThProps) {
  const { colors } = useTheme();

  return (
    <th
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${colors.border}`,
        textAlign: align,
        fontSize: 13,
        fontWeight: 600,
        color: colors.textSecondary,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

interface TdProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  style?: CSSProperties;
}

export function Td({ children, align = "left", style }: TdProps) {
  const { colors } = useTheme();

  return (
    <td
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${colors.border}`,
        textAlign: align,
        fontSize: 14,
        color: colors.text,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export default Table;
