import type { DisciplineRecord, IncidentType } from "./discipline.types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const TYPES_INCIDENTS: IncidentType[] = [
  "exclusion",
  "retard_grave",
  "impaye",
  "absence",
  "indiscipline",
  "fraude",
  "autre",
];

export function validateDisciplineRecord(data: Partial<DisciplineRecord>): void {
  if (!data.eleveId || data.eleveId.trim() === "") {
    throw new ValidationError("L'identifiant de l'élève est requis");
  }

  if (!data.eleveNom || data.eleveNom.trim() === "") {
    throw new ValidationError("Le nom de l'élève est requis");
  }

  if (!data.elevePrenom || data.elevePrenom.trim() === "") {
    throw new ValidationError("Le prénom de l'élève est requis");
  }

  if (!data.classe || data.classe.trim() === "") {
    throw new ValidationError("La classe est requise");
  }

  if (!data.type || !TYPES_INCIDENTS.includes(data.type)) {
    throw new ValidationError(`Type d'incident invalide. Valeurs acceptées: ${TYPES_INCIDENTS.join(", ")}`);
  }

  if (!data.description || data.description.trim() === "") {
    throw new ValidationError("La description est requise");
  }

  if (data.description.length > 1000) {
    throw new ValidationError("La description ne peut pas dépasser 1000 caractères");
  }
}

export function validateExclusion(eleveId: string, reason: string): void {
  if (!eleveId || eleveId.trim() === "") {
    throw new ValidationError("L'identifiant de l'élève est requis pour l'exclusion");
  }

  if (!reason || reason.trim() === "") {
    throw new ValidationError("La raison de l'exclusion est requise");
  }

  if (reason.length < 10) {
    throw new ValidationError("La raison de l'exclusion doit contenir au moins 10 caractères");
  }
}
