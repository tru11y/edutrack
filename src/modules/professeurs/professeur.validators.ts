import type { Professeur } from "./professeur.types.ts";

export function validateProfesseur(data: Partial<Professeur>) {
  if (!data.nom || data.nom.trim().length < 2) {
    throw new Error("Nom professeur invalide");
  }

  if (!data.prenom || data.prenom.trim().length < 2) {
    throw new Error("Prénom professeur invalide");
  }

  if (!data.email || !data.email.includes("@")) {
    throw new Error("Email professeur invalide");
  }

  if (!data.matieres || data.matieres.length === 0) {
    throw new Error("Au moins une matière est requise");
  }

  if (!data.classes || data.classes.length === 0) {
    throw new Error("Au moins une classe est requise");
  }
}
