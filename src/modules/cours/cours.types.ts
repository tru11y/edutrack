import type { Timestamp, FieldValue } from "firebase/firestore";

export type TypeCours = "renforcement" | "soir";
export type StatutCours = "planifie" | "termine" | "annule";

export interface Cours {
  id?: string;

  // Relations
  classe: string;        // ex: "6e"
  matiere: string;       // ex: "Maths"
  professeurId?: string;

  // Planning
  date: string;          // YYYY-MM-DD
  heureDebut: string;    // HH:mm
  heureFin: string;      // HH:mm
  type: TypeCours;

  // Contenu pédagogique
  contenu?: string;
  devoirs?: string;

  // État
  statut: StatutCours;

  // Métadonnées
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
