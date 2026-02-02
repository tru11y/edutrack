import { forwardRef, type InputHTMLAttributes } from "react";
import { useTheme } from "../../context/ThemeContext";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, fullWidth = false, style, ...props }, ref) => {
    const { colors } = useTheme();

    return (
      <div style={{ width: fullWidth ? "100%" : "auto" }}>
        {label && (
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: colors.textMuted,
              marginBottom: 8,
            }}
          >
            {label}
            {props.required && (
              <span style={{ color: colors.danger, marginLeft: 4 }}>*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          style={{
            width: fullWidth ? "100%" : "auto",
            padding: "12px 14px",
            border: `1px solid ${error ? colors.danger : colors.border}`,
            borderRadius: 10,
            fontSize: 14,
            background: colors.bgInput,
            color: colors.text,
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
            ...style,
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? colors.danger : colors.border;
            e.currentTarget.style.boxShadow = "none";
          }}
          {...props}
        />
        {error && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              color: colors.danger,
            }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

// Input pour la recherche
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
}: SearchInputProps) {
  const { colors } = useTheme();

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: colors.textMuted,
        }}
      >
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 14px 12px 44px",
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          fontSize: 14,
          background: colors.bgInput,
          color: colors.text,
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "none",
            background: colors.bgSecondary,
            color: colors.textMuted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
