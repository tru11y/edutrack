import { getAllPaiements } from "./paiement.service";
import type { Paiement } from "./paiement.types";

export interface PaiementStats {
  totalEncaisse: number;
  totalAttendu: number;
  totalImpayes: number;
  nombrePaiements: number;
  parStatut: {
    paye: number;
    partiel: number;
    impaye: number;
  };
}

export const getPaiementStats = async (): Promise<PaiementStats> => {
  const paiements: Paiement[] = await getAllPaiements();

  let totalEncaisse = 0;
  let totalAttendu = 0;
  let totalImpayes = 0;
  const parStatut = { paye: 0, partiel: 0, impaye: 0 };

  paiements.forEach((p) => {
    totalEncaisse += p.montantPaye || 0;
    totalAttendu += p.montantTotal || 0;

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

  return {
    totalEncaisse,
    totalAttendu,
    totalImpayes,
    nombrePaiements: paiements.length,
    parStatut,
  };
};
