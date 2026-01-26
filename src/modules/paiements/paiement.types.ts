import type { Timestamp, FieldValue } from "firebase/firestore";

export type MethodePaiement = "especes" | "mobile_money" | "virement" | "cheque";

export type StatutPaiement = "impaye" | "partiel" | "paye";

export interface Versement {
  montant: number;
  methode: MethodePaiement;
  date: Date | Timestamp;
}

export interface Paiement {
  id?: string;

  eleveId: string;
  eleveNom: string;

  mois: string; // YYYY-MM

  montantTotal: number;
  montantPaye: number;
  montantRestant: number;

  statut: StatutPaiement;

  versements: Versement[];

  createdAt?: Timestamp | FieldValue;
}
