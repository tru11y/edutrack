import { getAllPaiements } from "./paiement.service";

export interface PaiementStats {
  totalEncaisse: number;
  totalAttendu: number;
  totalImpayes: number;
  nombrePaiements: number;
}

export const getPaiementStats = async (): Promise<PaiementStats> => {
  const paiements: any[] = await getAllPaiements();

  let totalEncaisse = 0;
  let totalAttendu = 0;
  let totalImpayes = 0;

  paiements.forEach((p) => {
    totalEncaisse += p.montantPaye || 0;
    totalAttendu += p.montantTotal || 0;

    if (p.statut === "impaye") {
      totalImpayes += p.montantTotal || 0;
    }
  });

  return {
    totalEncaisse,
    totalAttendu,
    totalImpayes,
    nombrePaiements: paiements.length,
  };
};
