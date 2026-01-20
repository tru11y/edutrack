import type { Cours } from "./cours.types.ts";

function isValidTime(t?: string) {
  return !!t && /^\d{2}:\d{2}$/.test(t);
}

export function validateCours(data: Partial<Cours>) {
  if (!data.classe) throw new Error("Classe obligatoire");
  if (!data.matiere) throw new Error("Matière obligatoire");
  if (!data.professeurId) throw new Error("Professeur requis");
  if (!data.date) throw new Error("Date requise");

  if (!isValidTime(data.heureDebut) || !isValidTime(data.heureFin)) {
    throw new Error("Heures invalides (HH:mm)");
  }

  if (data.heureDebut! >= data.heureFin!) {
    throw new Error("Heure de fin doit être après heure de début");
  }

  if (!data.type) {
    throw new Error("Type de cours requis");
  }
}
