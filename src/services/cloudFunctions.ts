/**
 * Service pour appeler les Cloud Functions securisees
 * Ces fonctions valident les operations cote serveur
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

// Initialiser Functions avec la region europe-west1
const functions = getFunctions(app, "europe-west1");

// Connecter a l'emulateur en dev (decommentez si necessaire)
// if (import.meta.env.DEV) {
//   connectFunctionsEmulator(functions, "localhost", 5001);
// }

// ========================================
// TYPES
// ========================================

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

// ========================================
// CLOUD FUNCTIONS
// ========================================

/**
 * Creer un utilisateur via Cloud Function (securise)
 * Seuls les admins peuvent appeler cette fonction
 */
export async function createUserSecure(params: CreateUserParams): Promise<CreateUserResult> {
  const createUserFn = httpsCallable<CreateUserParams, CreateUserResult>(functions, "createUser");
  const result = await createUserFn(params);
  return result.data;
}

/**
 * Supprimer un utilisateur via Cloud Function (securise)
 * Seuls les admins peuvent appeler cette fonction
 */
export async function deleteUserSecure(userId: string): Promise<{ success: boolean; message: string }> {
  const deleteUserFn = httpsCallable<{ userId: string }, { success: boolean; message: string }>(
    functions,
    "deleteUser"
  );
  const result = await deleteUserFn({ userId });
  return result.data;
}

/**
 * Creer un paiement via Cloud Function (securise)
 * Admins et gestionnaires peuvent appeler cette fonction
 * Inclut validation serveur des montants et doublons
 */
export async function createPaiementSecure(params: CreatePaiementParams): Promise<CreatePaiementResult> {
  const createPaiementFn = httpsCallable<CreatePaiementParams, CreatePaiementResult>(
    functions,
    "createPaiement"
  );
  const result = await createPaiementFn(params);
  return result.data;
}

/**
 * Activer/Desactiver un utilisateur via Cloud Function (securise)
 * Seuls les admins peuvent appeler cette fonction
 */
export async function toggleUserStatusSecure(
  params: ToggleUserStatusParams
): Promise<{ success: boolean; message: string }> {
  const toggleFn = httpsCallable<ToggleUserStatusParams, { success: boolean; message: string }>(
    functions,
    "toggleUserStatus"
  );
  const result = await toggleFn(params);
  return result.data;
}

/**
 * Obtenir les logs d'audit via Cloud Function (securise)
 * Seuls les admins peuvent voir les logs
 */
export async function getAuditLogsSecure(limit = 100): Promise<{ success: boolean; logs: AuditLog[] }> {
  const getLogsFn = httpsCallable<{ limit: number }, { success: boolean; logs: AuditLog[] }>(
    functions,
    "getAuditLogs"
  );
  const result = await getLogsFn({ limit });
  return result.data;
}

// ========================================
// HELPER - Gestion des erreurs
// ========================================

/**
 * Extraire un message d'erreur lisible depuis une erreur Cloud Function
 */
export function getCloudFunctionErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message;

    // Messages d'erreur Firebase Functions
    if (msg.includes("unauthenticated")) {
      return "Vous devez etre connecte pour effectuer cette action.";
    }
    if (msg.includes("permission-denied")) {
      return "Vous n'avez pas les droits necessaires.";
    }
    if (msg.includes("already-exists")) {
      return "Cet element existe deja.";
    }
    if (msg.includes("not-found")) {
      return "Element non trouve.";
    }
    if (msg.includes("invalid-argument")) {
      return msg.replace("invalid-argument: ", "");
    }

    return msg;
  }

  return "Une erreur inattendue s'est produite.";
}
