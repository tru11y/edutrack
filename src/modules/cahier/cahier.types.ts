import { Timestamp } from "firebase/firestore";

export interface CahierTexteEntry {
  id?: string;

  coursId: string;
  date: string;              // YYYY-MM-DD

  profId: string;
  classe: string;

  eleves: string[];          // IDs des élèves présents
  contenu: string;           // ce qui a été fait
  devoirs?: string;          // optionnel

  createdAt?: Timestamp;
}
