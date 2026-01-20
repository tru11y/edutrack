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

  isSystem: boolean; // déclenché automatiquement
  createdAt?: Timestamp;
}
