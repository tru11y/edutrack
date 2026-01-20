import { Timestamp } from "firebase/firestore";

export interface DisciplineRecord {
  id?: string;
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  motif: string;
  sanction: string;
  date?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
