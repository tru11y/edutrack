export interface Professeur {
  id?: string;
  nom: string;
  prenom: string;
  matieres: string[];
  classes: string[];
  telephone?: string;
  email?: string;
  statut: "actif" | "inactif";
  createdAt?: any;
}
