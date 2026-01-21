export type UserRole = "admin" | "prof" | "eleve" | "parent";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  isActive: boolean;

  eleveId?: string;
  professeurId?: string;
  
  isBanned?: boolean;
}
