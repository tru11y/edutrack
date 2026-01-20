import { Timestamp } from "firebase/firestore";

export type Sexe = "M" | "F";
export type StatutEleve = "actif" | "inactif";

export interface ParentContact {
  nom: string;
  telephone: string;
  lien: "pere" | "mere" | "tuteur";
}

export interface ContactUrgence {
  nom: string;
  telephone: string;
  relation: string;
}

export interface Adresse {
  quartier?: string;
  commune?: string;
  ville?: string;
}

export interface Eleve {
  id?: string;

  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe: Sexe;

  classe: string;
  ecoleOrigine?: string;

  adresse?: Adresse;

  parents: ParentContact[];
  contactUrgence?: ContactUrgence;

  statut: StatutEleve;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
