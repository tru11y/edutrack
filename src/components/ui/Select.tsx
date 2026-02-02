import { useTheme } from "../../context/ThemeContext";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md";
  "aria-label"?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Selectionner...",
  label,
  disabled = false,
  fullWidth = false,
  size = "md",
  "aria-label": ariaLabel,
}: SelectProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { padding: "8px 12px", fontSize: 13 },
    md: { padding: "12px 16px", fontSize: 14 },
  };

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
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel || label}
        style={{
          width: fullWidth ? "100%" : "auto",
          minWidth: 180,
          padding: sizeStyles[size].padding,
          paddingRight: 36,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          fontSize: sizeStyles[size].fontSize,
          background: colors.bgInput,
          color: value ? colors.text : colors.textMuted,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          transition: "border-color 0.2s, box-shadow 0.2s",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Select pour les classes (pre-configure)
interface ClassSelectProps {
  value: string;
  onChange: (value: string) => void;
  classes: string[];
  allLabel?: string;
}

export function ClassSelect({
  value,
  onChange,
  classes,
  allLabel = "Toutes les classes",
}: ClassSelectProps) {
  const options: SelectOption[] = [
    { value: "", label: allLabel },
    ...classes.map((c) => ({ value: c, label: c })),
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder=""
      aria-label="Filtrer par classe"
    />
  );
}
