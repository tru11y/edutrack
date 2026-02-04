import { getAllPaiements } from "./paiement.service";
import type { Paiement } from "./paiement.types";
import type { Timestamp } from "firebase/firestore";

export interface PaiementStats {
  totalEncaisse: number;
  totalAttendu: number;
  totalImpayes: number;
  nombrePaiements: number;
  tauxCouverture: number;
  parStatut: {
    paye: number;
    partiel: number;
    impaye: number;
  };
}

/**
 * Calcule les statistiques de paiement
 * @param moisFilter - Filtre optionnel par mois (format YYYY-MM)
 */
export const getPaiementStats = async (moisFilter?: string): Promise<PaiementStats> => {
  const allPaiements: Paiement[] = await getAllPaiements();

  // Filtrer par mois si spécifié
  const paiements = moisFilter
    ? allPaiements.filter((p) => p.mois === moisFilter)
    : allPaiements;

  let totalEncaisse = 0;
  let totalAttendu = 0;
  let totalImpayes = 0;
  const parStatut = { paye: 0, partiel: 0, impaye: 0 };

  paiements.forEach((p) => {
    // Total attendu = somme des montants totaux
    totalAttendu += p.montantTotal || 0;

    // Total encaissé = somme des montants payés
    totalEncaisse += p.montantPaye || 0;

    // Calcul des impayés selon le statut
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
  // Ne peut être 100% que si tout est payé
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

/**
 * Calcule les statistiques pour le mois en cours
 */
export const getPaiementStatsCurrentMonth = async (): Promise<PaiementStats> => {
  const now = new Date();
  const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return getPaiementStats(mois);
};

/**
 * Convertit un Timestamp Firestore ou Date en Date
 */
export const toDate = (date: Timestamp | Date | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof (date as Timestamp).toDate === "function") {
    return (date as Timestamp).toDate();
  }
  return null;
};
