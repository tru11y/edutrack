export type EvaluationType = "devoir" | "examen" | "interro";
export type Trimestre = 1 | 2 | 3;

export interface Evaluation {
  id: string;
  classe: string;
  matiere: string;
  titre: string;
  type: EvaluationType;
  date: string;
  trimestre: Trimestre;
  coefficient: number;
  maxNote: number;
  professeurId: string;
  professeurNom: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Note {
  id: string;
  evaluationId: string;
  eleveId: string;
  eleveNom: string;
  note: number;
  commentaire: string;
  absence: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  evaluation?: {
    titre: string;
    matiere: string;
    type: string;
    date: string;
    trimestre: number;
    coefficient: number;
    maxNote: number;
  };
}

export interface MoyenneMatiere {
  matiere: string;
  moyenne: number;
  totalCoef: number;
  notes: Array<{
    titre: string;
    note: number;
    maxNote: number;
    coefficient: number;
    type: string;
    absence: boolean;
  }>;
}

export interface Bulletin {
  id?: string;
  eleveId: string;
  classe: string;
  trimestre: number;
  anneeScolaire: string;
  moyennesMatiere: Record<string, number>;
  moyenneGenerale: number;
  rang: number;
  totalEleves: number;
  absencesTotal: number;
  retardsTotal: number;
  appreciationGenerale: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  devoir: "Devoir",
  examen: "Examen",
  interro: "Interrogation",
};

export const TRIMESTRE_LABELS: Record<Trimestre, string> = {
  1: "1er Trimestre",
  2: "2eme Trimestre",
  3: "3eme Trimestre",
};
