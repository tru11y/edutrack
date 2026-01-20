import { getAllPaiements } from "./paiement.service";

export const getPaiementStats = async () => {
  const paiements = await getAllPaiements();

  let totalEncaisse = 0;
  let totalAttendu = 0;
  let totalImpayes = 0;

  paiements.forEach((p: any) => {
    totalEncaisse += p.montantPaye;
    totalAttendu += p.montantTotal;

    if (p.statut === "impaye") {
      totalImpayes += p.montantTotal;
    }
  });

  return {
    totalEncaisse,
    totalAttendu,
    totalImpayes,
    nombrePaiements: paiements.length,
  };
};
