import type { Timestamp, FieldValue } from "firebase/firestore";

export type Sexe = "M" | "F";
export type StatutEleve = "actif" | "inactif";

// Type pour les champs de date qui peuvent etre soit un Timestamp (lecture) soit un FieldValue (ecriture)
export type FirestoreDate = Timestamp | FieldValue;

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

  // ======================
  // METIER
  // ======================
  isBanned?: boolean;
  banReason?: string | null;
  banDate?: FirestoreDate | null;

  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}
