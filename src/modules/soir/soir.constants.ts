export const SOIR_NIVEAUX = [
  { id: "niveau1", label: "Niveau 1", classes: ["Alphabétisation", "CP1", "CP2"] },
  { id: "niveau2", label: "Niveau 2", classes: ["CE1", "CE2"] },
  { id: "niveau3", label: "Niveau 3", classes: ["CM1", "CM2"] },
];

export const ALL_SOIR_CLASSES = SOIR_NIVEAUX.flatMap((n) => n.classes);
