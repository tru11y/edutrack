import { Timestamp } from "firebase/firestore";

export interface CahierEntry {
  id?: string;

  coursId: string;
  classe: string;
  profId: string;
  profNom: string;

  date: string;

  eleves: string[];

  contenu?: string;
  devoirs?: string;

  // 🔐 SIGNATURE
  isSigned: boolean;
  signedAt?: Timestamp;
  signatureToken?: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
