import { Timestamp } from "firebase/firestore";

export type IncidentType =
  | "exclusion"
  | "retard_grave"
  | "impaye"
  | "absence"
  | "indiscipline"
  | "fraude"
  | "autre";

export interface DisciplineRecord {
  id?: string;

  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;

  coursId?: string;
  coursDate?: string;

  profId?: string;
  profNom?: string;

  type: IncidentType;
  description: string;
  motif?: string;
  sanction?: string;

  isSystem: boolean;
  date?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DisciplineEntry {
  id?: string;

  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;

  coursId: string;

  motif: string;
  auteurId: string;
  auteurNom: string;

  type: "exclusion";

  createdAt?: Timestamp;
}

export interface DisciplineLog {
  id?: string;
  eleveId: string;
  reason: string;
  auteur: string;
  createdAt?: Timestamp;
}
