import { getAllPaiements } from "./modules/paiements/paiement.service";
import type { Paiement } from "./modules/paiements/paiement.types";

export const getPaiementStats = async (moisFilter?: string) => {
  const allPaiements = await getAllPaiements();

  // Filtrer par mois si spécifié
  const paiements = moisFilter
    ? allPaiements.filter((p: Paiement) => p.mois === moisFilter)
    : allPaiements;

  let totalEncaisse = 0;
  let totalAttendu = 0;
  let totalImpayes = 0;
  const parStatut = { paye: 0, partiel: 0, impaye: 0 };

  paiements.forEach((p: Paiement) => {
    totalAttendu += p.montantTotal || 0;
    totalEncaisse += p.montantPaye || 0;

    if (p.statut === "impaye") {
      totalImpayes += p.montantTotal || 0;
      parStatut.impaye++;
    } else if (p.statut === "partiel") {
      totalImpayes += p.montantRestant || 0;
      parStatut.partiel++;
    } else if (p.statut === "paye") {
      parStatut.paye++;
    }
  });

  // Taux de couverture = (totalPaye / totalAttendu) * 100
  const tauxCouverture = totalAttendu > 0
    ? Math.round((totalEncaisse / totalAttendu) * 100)
    : 0;

  return {
    totalEncaisse,
    totalAttendu,
    totalImpayes,
    nombrePaiements: paiements.length,
    tauxCouverture,
    parStatut,
  };
};
