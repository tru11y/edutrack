export type EleveStatut = "actif" | "inactif" | "suspendu";
export type StatutPaiementMensuel = "a_jour" | "non_a_jour";

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
  statutPaiementMensuel?: StatutPaiementMensuel;
  dateInscription: Date;
  createdAt: Date;
}
