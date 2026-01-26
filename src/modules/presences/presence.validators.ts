import type { PresenceCoursPayload, PresenceItem, StatutMetier } from "./presence.types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const STATUTS_PRESENCE: Array<PresenceItem["statut"]> = ["present", "absent", "retard"];
const STATUTS_METIER: StatutMetier[] = ["essai", "autorise", "a_renvoyer", "banni"];

export function validatePresencePayload(payload: Partial<PresenceCoursPayload>): void {
  if (!payload.coursId || payload.coursId.trim() === "") {
    throw new ValidationError("L'identifiant du cours est requis");
  }

  if (!payload.classe || payload.classe.trim() === "") {
    throw new ValidationError("La classe est requise");
  }

  if (!payload.date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    throw new ValidationError("La date doit être au format YYYY-MM-DD");
  }

  if (!payload.presences || !Array.isArray(payload.presences)) {
    throw new ValidationError("La liste des présences est requise");
  }

  if (payload.presences.length === 0) {
    throw new ValidationError("La liste des présences ne peut pas être vide");
  }

  // Valider chaque présence
  payload.presences.forEach((presence, index) => {
    validatePresenceItem(presence, index);
  });
}

export function validatePresenceItem(item: Partial<PresenceItem>, index?: number): void {
  const prefix = index !== undefined ? `Présence ${index + 1}: ` : "";

  if (!item.eleveId || item.eleveId.trim() === "") {
    throw new ValidationError(`${prefix}L'identifiant de l'élève est requis`);
  }

  if (!item.statut || !STATUTS_PRESENCE.includes(item.statut)) {
    throw new ValidationError(`${prefix}Statut invalide. Valeurs acceptées: ${STATUTS_PRESENCE.join(", ")}`);
  }

  if (item.statut === "retard") {
    if (item.minutesRetard === undefined || item.minutesRetard < 0) {
      throw new ValidationError(`${prefix}Les minutes de retard doivent être spécifiées pour un retard`);
    }

    if (item.minutesRetard > 120) {
      throw new ValidationError(`${prefix}Un retard de plus de 120 minutes devrait être une absence`);
    }
  }

  if (item.statutMetier && !STATUTS_METIER.includes(item.statutMetier)) {
    throw new ValidationError(`${prefix}Statut métier invalide. Valeurs acceptées: ${STATUTS_METIER.join(", ")}`);
  }
}

export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
