export type UserRole = "admin" | "gestionnaire" | "prof" | "eleve" | "parent";

// Pour compatibilite avec l'ancien code
export type LegacyUserRole = "admin" | "admin2" | "prof" | "eleve" | "parent";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  isActive: boolean;

  eleveId?: string;
  professeurId?: string;
  
  isBanned?: boolean;
}
