import type { Jour } from "../../constants";

export interface Creneau {
  id?: string;
  schoolId?: string;
  jour: Jour;
  heureDebut: string;     // "14:00"
  heureFin: string;       // "16:00"
  classe: string;
  matiere: string;
  professeurId: string;
  type: "renforcement" | "soir";
  createdAt?: Date;
}
