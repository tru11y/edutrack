import type { Jour } from "../../constants";

export interface ScheduleSlot {
  jour: Jour;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  profId?: string;
  profNom?: string;
}

export interface ClasseData {
  id?: string;
  nom: string;
  niveau?: string;
  description?: string;
  emploiDuTemps?: ScheduleSlot[];
}

export interface Matiere {
  id?: string;
  nom: string;
  description?: string;
  couleur?: string;
}

export interface ClasseStats {
  total: number;
  garcons: number;
  filles: number;
}
