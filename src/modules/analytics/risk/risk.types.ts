export type RiskLevel = "faible" | "moyen" | "eleve";

export interface RiskInput {
  absences: number;
  retards: number;
  exclusions: number;
  paiementsEnRetard: number;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
}
