import type { CahierEntry } from "./cahier.types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateCahierEntry(data: Partial<CahierEntry>): void {
  if (!data.coursId || data.coursId.trim() === "") {
    throw new ValidationError("L'identifiant du cours est requis");
  }

  if (!data.classe || data.classe.trim() === "") {
    throw new ValidationError("La classe est requise");
  }

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new ValidationError("La date doit être au format YYYY-MM-DD");
  }

  if (!data.contenu || data.contenu.trim() === "") {
    throw new ValidationError("Le contenu du cours est requis");
  }

  if (data.contenu.length > 5000) {
    throw new ValidationError("Le contenu ne peut pas dépasser 5000 caractères");
  }

  if (data.devoirs && data.devoirs.length > 2000) {
    throw new ValidationError("Les devoirs ne peuvent pas dépasser 2000 caractères");
  }
}

export function validateCahierUpdate(data: Partial<CahierEntry>): void {
  if (data.contenu !== undefined) {
    if (data.contenu.trim() === "") {
      throw new ValidationError("Le contenu ne peut pas être vide");
    }
    if (data.contenu.length > 5000) {
      throw new ValidationError("Le contenu ne peut pas dépasser 5000 caractères");
    }
  }

  if (data.devoirs !== undefined && data.devoirs.length > 2000) {
    throw new ValidationError("Les devoirs ne peuvent pas dépasser 2000 caractères");
  }

  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new ValidationError("La date doit être au format YYYY-MM-DD");
  }
}
