import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

// Icones par defaut
const DefaultIcons = {
  users: (color: string) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M34 42V38C34 34.69 31.31 32 28 32H12C8.69 32 6 34.69 6 38V42M42 42V38C42 35.58 40.42 33.53 38.24 32.84M31.24 7.16C33.4 7.86 34.98 9.92 34.98 12.32C34.98 14.72 33.4 16.78 31.24 17.48M24 18C24 21.31 21.31 24 18 24C14.69 24 12 21.31 12 18C12 14.69 14.69 12 18 12C21.31 12 24 14.69 24 18Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  search: (color: string) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M22 38C30.84 38 38 30.84 38 22C38 13.16 30.84 6 22 6C13.16 6 6 13.16 6 22C6 30.84 13.16 38 22 38Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 42L33.65 33.65"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  calendar: (color: string) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect
        x="6"
        y="10"
        width="36"
        height="32"
        rx="4"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 6V14M16 6V14M6 22H42"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  document: (color: string) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M28 6H12C9.79 6 8 7.79 8 10V38C8 40.21 9.79 42 12 42H36C38.21 42 40 40.21 40 38V18L28 6Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 6V18H40M32 26H16M32 34H16M20 18H16"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  folder: (color: string) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M44 36C44 37.06 43.58 38.08 42.83 38.83C42.08 39.58 41.06 40 40 40H8C6.94 40 5.92 39.58 5.17 38.83C4.42 38.08 4 37.06 4 36V12C4 10.94 4.42 9.92 5.17 9.17C5.92 8.42 6.94 8 8 8H18L22 14H40C41.06 14 42.08 14.42 42.83 15.17C43.58 15.92 44 16.94 44 18V36Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: "48px 32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: colors.bgSecondary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          color: colors.textMuted,
        }}
      >
        {icon || DefaultIcons.folder(colors.textMuted)}
      </div>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: 18,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 14,
            color: colors.textMuted,
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// Export des icones pour une utilisation externe
export { DefaultIcons as EmptyStateIcons };
