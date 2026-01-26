import type { Paiement, MethodePaiement, StatutPaiement } from "./paiement.types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const METHODES_VALIDES: MethodePaiement[] = ["especes", "mobile_money", "virement", "cheque"];
const STATUTS_VALIDES: StatutPaiement[] = ["impaye", "partiel", "paye"];

export function validatePaiement(data: Partial<Paiement>): void {
  if (!data.eleveId || data.eleveId.trim() === "") {
    throw new ValidationError("L'identifiant de l'élève est requis");
  }

  if (!data.eleveNom || data.eleveNom.trim() === "") {
    throw new ValidationError("Le nom de l'élève est requis");
  }

  if (!data.mois || !/^\d{4}-\d{2}$/.test(data.mois)) {
    throw new ValidationError("Le mois doit être au format YYYY-MM");
  }

  if (data.montantTotal === undefined || data.montantTotal < 0) {
    throw new ValidationError("Le montant total doit être positif");
  }

  if (data.montantPaye !== undefined && data.montantPaye < 0) {
    throw new ValidationError("Le montant payé ne peut pas être négatif");
  }

  if (data.montantPaye !== undefined && data.montantTotal !== undefined) {
    if (data.montantPaye > data.montantTotal) {
      throw new ValidationError("Le montant payé ne peut pas dépasser le montant total");
    }
  }

  if (data.statut && !STATUTS_VALIDES.includes(data.statut)) {
    throw new ValidationError(`Statut invalide. Valeurs acceptées: ${STATUTS_VALIDES.join(", ")}`);
  }
}

export function validateVersement(montant: number, methode: MethodePaiement): void {
  if (montant <= 0) {
    throw new ValidationError("Le montant du versement doit être positif");
  }

  if (!METHODES_VALIDES.includes(methode)) {
    throw new ValidationError(`Méthode de paiement invalide. Valeurs acceptées: ${METHODES_VALIDES.join(", ")}`);
  }
}

export function validateMontant(montant: number): boolean {
  return typeof montant === "number" && montant >= 0 && isFinite(montant);
}
