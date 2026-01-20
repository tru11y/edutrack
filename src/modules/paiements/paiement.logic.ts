import type { StatutPaiement } from "./paiement.types";

export function calculerPaiement(
  montantTotal: number,
  montantPaye: number
): {
  statut: StatutPaiement;
  montantRestant: number;
} {
  const restant = Math.max(montantTotal - montantPaye, 0);

  if (montantPaye === 0) {
    return { statut: "impaye", montantRestant: restant };
  }

  if (montantPaye < montantTotal) {
    return { statut: "partiel", montantRestant: restant };
  }

  return { statut: "paye", montantRestant: 0 };
}
