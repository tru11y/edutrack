export interface Depense {
  id: string;
  libelle: string;
  categorie: string;
  montant: number;
  date: string;
  createdAt: string | null;
  createdBy: string;
}

export interface CreateDepenseParams {
  libelle: string;
  categorie: string;
  montant: number;
  date: string;
}

export interface Salaire {
  id: string;
  profId: string;
  profNom: string;
  mois: string;
  montant: number;
  statut: "paye" | "non_paye";
  datePaiement: string | null;
  createdAt: string | null;
}

export interface CreateSalaireParams {
  profId: string;
  mois: string;
  montant: number;
  statut: "paye" | "non_paye";
  datePaiement?: string;
}

export interface ComptaStats {
  totalPaiementsRecus: number;
  totalDepenses: number;
  totalSalaires: number;
  resultatNet: number;
  mois: string;
}
