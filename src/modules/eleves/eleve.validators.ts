import type { Eleve } from "./eleve.types";

export function validateEleve(data: Partial<Eleve>) {
  if (!data.nom || data.nom.trim().length < 2) {
    throw new Error("Nom invalide (minimum 2 caracteres)");
  }

  if (!data.prenom || data.prenom.trim().length < 2) {
    throw new Error("Prenom invalide (minimum 2 caracteres)");
  }

  if (!data.classe || data.classe.trim().length === 0) {
    throw new Error("Classe obligatoire");
  }

  if (!data.parents || data.parents.length === 0) {
    throw new Error("Au moins un parent avec nom et telephone est requis");
  }

  // Validate each parent has required fields
  for (const p of data.parents) {
    if (!p.nom || p.nom.trim().length === 0) {
      throw new Error("Nom du parent requis");
    }
    if (!p.telephone || p.telephone.trim().length === 0) {
      throw new Error("Telephone du parent requis");
    }
    if (!p.lien || !["pere", "mere", "tuteur"].includes(p.lien)) {
      throw new Error("Lien de parente invalide");
    }
  }
}
