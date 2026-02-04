/**
 * Application Constants
 * Centralise toutes les valeurs magiques du projet
 */

// ============================================
// VALIDATION
// ============================================
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MIN_PASSWORD_LENGTH: 6,
  MAX_MONTHS_TO_CHECK: 12,
  BAN_THRESHOLD_MONTHS: 2,
} as const;

// ============================================
// TIMING (en millisecondes)
// ============================================
export const TIMING = {
  ONLINE_THRESHOLD_MS: 3 * 60 * 1000, // 3 minutes
  UPDATE_INTERVAL_MS: 60 * 1000, // 1 minute
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_DELAY_MS: 300,
} as const;

// ============================================
// UI SIZING
// ============================================
export const SIZES = {
  AVATAR: {
    SM: 32,
    MD: 44,
    LG: 64,
  },
  ICON: {
    SM: 14,
    MD: 18,
    LG: 24,
  },
  BORDER_RADIUS: {
    SM: 6,
    MD: 10,
    LG: 16,
  },
  MODAL: {
    SM: 400,
    MD: 520,
    LG: 640,
    XL: 700,
  },
} as const;

// ============================================
// GRADIENTS
// ============================================
export const GRADIENTS = {
  primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  info: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
} as const;

// ============================================
// GENDER COLORS (static, not theme-dependent)
// ============================================
export const GENDER_COLORS = {
  male: {
    bg: "#dbeafe",
    text: "#3b82f6",
    textDark: "#2563eb",
    border: "#93c5fd",
  },
  female: {
    bg: "#fce7f3",
    text: "#ec4899",
    textDark: "#db2777",
    border: "#f9a8d4",
  },
} as const;

// ============================================
// ROLE CONFIGURATION
// ============================================
export const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    gradient: GRADIENTS.primary,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  gestionnaire: {
    label: "Gestionnaire",
    gradient: GRADIENTS.warning,
    color: "#d97706",
    bg: "#fef3c7",
  },
  prof: {
    label: "Prof",
    gradient: GRADIENTS.success,
    color: "#10b981",
    bg: "#ecfdf5",
  },
} as const;

// ============================================
// JOURS DE LA SEMAINE
// ============================================
export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
export type Jour = (typeof JOURS)[number];

// ============================================
// ANIMATIONS CSS
// ============================================
export const CSS_ANIMATIONS = {
  spin: `@keyframes spin { to { transform: rotate(360deg); } }`,
  pulse: `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`,
  fadeIn: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`,
} as const;
