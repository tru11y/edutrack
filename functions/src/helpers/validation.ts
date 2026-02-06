export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_REGEX = /^\d{4}-\d{2}$/;

export const VALID_ROLES = ["admin", "gestionnaire", "prof", "eleve", "parent"] as const;
export const VALID_PRESENCE_STATUTS = ["present", "absent", "retard", "excuse"] as const;
export const VALID_PAYMENT_STATUTS = ["paye", "partiel", "impaye"] as const;
export const VALID_SALARY_STATUTS = ["paye", "non_paye"] as const;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidDate(date: string): boolean {
  if (!DATE_REGEX.test(date)) return false;
  return !isNaN(new Date(date).getTime());
}

export function isValidMonth(month: string): boolean {
  return MONTH_REGEX.test(month);
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && value >= 0;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
