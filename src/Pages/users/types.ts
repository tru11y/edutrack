export interface ClasseData {
  id?: string;
  nom: string;
}

export interface UserData {
  id: string;
  email: string;
  role: "admin" | "gestionnaire" | "prof";
  isActive: boolean;
  nom?: string;
  prenom?: string;
  createdAt?: unknown;
  classesEnseignees?: string[];
}

export interface UserFormData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: "admin" | "gestionnaire" | "prof";
  classesEnseignees: string[];
}

export interface EditFormData {
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "gestionnaire" | "prof";
  newPassword: string;
  newEmail: string;
  classesEnseignees: string[];
}
