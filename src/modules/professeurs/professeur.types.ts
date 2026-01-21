import { Timestamp } from "firebase/firestore";

export interface Professeur {
  id?: string;

  nom: string;
  prenom: string;
  telephone?: string;
  matieres: string[];   // ex: ["Maths", "Physique"]
  classes: string[];    // ex: ["3e", "Tle"]

  statut: "actif" | "inactif";

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
