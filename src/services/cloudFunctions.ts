import { httpsCallable } from "firebase/functions";
import { functions, ensureAuth } from "./firebase";

async function callFunction<T, R>(name: string, data?: T): Promise<R> {
  await ensureAuth();
  const fn = httpsCallable<T, R>(functions, name);
  const result = await fn(data as T);
  return result.data;
}

export interface CreateUserParams {
  email: string;
  password: string;
  role: "admin" | "gestionnaire" | "prof" | "eleve" | "parent";
  nom?: string;
  prenom?: string;
  eleveId?: string;
  professeurId?: string;
  enfantsIds?: string[];
}

export interface CreateUserResult {
  success: boolean;
  uid: string;
  message: string;
}

export interface CreatePaiementParams {
  eleveId: string;
  mois: string;
  montantTotal: number;
  montantPaye: number;
  datePaiement: string;
}

export interface CreatePaiementResult {
  success: boolean;
  id: string;
  message: string;
}

export interface ToggleUserStatusParams {
  userId: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  performedBy: string;
  timestamp: string;
}

export interface CahierEntryEleve {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
}

export interface CahierEntryAdmin {
  id: string;
  date: string;
  classe: string;
  coursId: string;
  profId: string;
  profNom: string;
  contenu: string;
  devoirs: string;
  isSigned: boolean;
  signedAt: string | null;
  eleves: string[];
  elevesDetails: CahierEntryEleve[];
  createdAt: string | null;
}

export interface GetCahierTextesAdminParams {
  classe?: string;
  profId?: string;
  mois?: string;
}

export interface CahierTexteAdmin {
  id: string;
  date: string;
  classe: string;
  coursId: string;
  profId: string;
  profNom: string;
  contenu: string;
  devoirs: string;
  isSigned: boolean;
  signedAt: string | null;
  createdAt: string | null;
}

export function createUserSecure(params: CreateUserParams): Promise<CreateUserResult> {
  return callFunction("createUser", params);
}

export function deleteUserSecure(userId: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteUser", { userId });
}

export function createPaiementSecure(params: CreatePaiementParams): Promise<CreatePaiementResult> {
  return callFunction("createPaiement", params);
}

export function toggleUserStatusSecure(params: ToggleUserStatusParams): Promise<{ success: boolean; message: string }> {
  return callFunction("toggleUserStatus", params);
}

export function getAuditLogsSecure(limit = 100): Promise<{ success: boolean; logs: AuditLog[] }> {
  return callFunction("getAuditLogs", { limit });
}

export function getAllCahierEntriesSecure(): Promise<{ success: boolean; entries: CahierEntryAdmin[] }> {
  return callFunction("getAllCahierEntries", undefined);
}

export function getCahierTextesAdmin(params: GetCahierTextesAdminParams = {}): Promise<{ success: boolean; entries: CahierTexteAdmin[] }> {
  return callFunction("getCahierTextesAdmin", params);
}

export interface AdminDashboardStats {
  totalEleves: number;
  totalProfesseurs: number;
  totalClasses: number;
  totalPaiementsRecus: number;
  totalPaiementsAttendus: number;
  tauxCouverture: number;
  totalDepenses: number;
  totalSalaires: number;
}

export function getAdminDashboardStatsSecure(): Promise<{ success: boolean; stats: AdminDashboardStats }> {
  return callFunction("getAdminDashboardStats", undefined);
}

export function getCloudFunctionErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes("NOT_AUTHENTICATED") || msg.includes("unauthenticated")) {
      return "Vous devez etre connecte pour effectuer cette action.";
    }
    if (msg.includes("permission-denied")) return "Vous n'avez pas les droits necessaires.";
    if (msg.includes("already-exists")) return "Cet element existe deja.";
    if (msg.includes("not-found")) return "Element non trouve.";
    if (msg.includes("invalid-argument")) return msg.replace("invalid-argument: ", "");
    return msg;
  }
  return "Une erreur inattendue s'est produite.";
}
