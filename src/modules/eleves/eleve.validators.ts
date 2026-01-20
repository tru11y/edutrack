import type { Eleve } from "./eleve.types";

export function validateEleve(data: Partial<Eleve>) {
  if (!data.nom || data.nom.trim().length < 2) {
    throw new Error("Nom invalide");
  }

  if (!data.prenom || data.prenom.trim().length < 2) {
    throw new Error("Prénom invalide");
  }

  if (!data.classe) {
    throw new Error("Classe obligatoire");
  }

  if (!data.parents || data.parents.length === 0) {
    throw new Error("Au moins un parent est requis");
  }

  data.parents.forEach((p) => {
    if (!p.nom || !p.telephone || !p.lien) {
      throw new Error("Informations parent incomplètes");
    }
  });
}
