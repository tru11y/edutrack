import type { RiskInput, RiskResult, RiskLevel } from "./risk.types";

/**
 * Pondération métier
 */
const WEIGHTS = {
  absence: 2,
  retard: 1,
  exclusion: 3,
  paiement: 4,
};

/**
 * Seuils de décision
 */
function levelFromScore(score: number): RiskLevel {
  if (score >= 15) return "eleve";
  if (score >= 7) return "moyen";
  return "faible";
}

/**
 * 🔥 Fonction principale IA
 */
export function calculerRisque(input: RiskInput): RiskResult {
  const score =
    input.absences * WEIGHTS.absence +
    input.retards * WEIGHTS.retard +
    input.exclusions * WEIGHTS.exclusion +
    input.paiementsEnRetard * WEIGHTS.paiement;

  const level = levelFromScore(score);

  return { score, level };
}
