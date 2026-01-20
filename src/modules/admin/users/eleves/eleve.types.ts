export type EleveStatut = "actif" | "inactif" | "suspendu";

export interface Eleve {
  id?: string;
  nom: string;
  prenom: string;
  classe: string;
  sexe: "M" | "F";
  telephone: string;
  email?: string;
  parentNom: string;
  parentTelephone: string;
  adresse: string;
  matricule: string;
  statut: EleveStatut;
  dateInscription: Date;
  createdAt: Date;
}
