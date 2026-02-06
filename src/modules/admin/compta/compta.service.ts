import { httpsCallable } from "firebase/functions";
import { functions, ensureAuth } from "../../../services/firebase";
import type {
  Depense,
  CreateDepenseParams,
  Salaire,
  CreateSalaireParams,
  ComptaStats,
} from "./compta.types";

async function callFunction<T, R>(name: string, data?: T): Promise<R> {
  await ensureAuth();
  const fn = httpsCallable<T, R>(functions, name);
  const result = await fn(data as T);
  return result.data;
}

// Depenses
export function createDepenseSecure(
  params: CreateDepenseParams
): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createDepense", params);
}

export function getDepensesSecure(
  mois?: string
): Promise<{ success: boolean; depenses: Depense[] }> {
  return callFunction("getDepenses", { mois });
}

export function deleteDepenseSecure(
  depenseId: string
): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteDepense", { depenseId });
}

// Salaires
export function createSalaireSecure(
  params: CreateSalaireParams
): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createSalaire", params);
}

export function getSalairesSecure(
  mois?: string
): Promise<{ success: boolean; salaires: Salaire[] }> {
  return callFunction("getSalaires", { mois });
}

export function updateSalaireStatutSecure(
  salaireId: string,
  statut: "paye" | "non_paye",
  datePaiement?: string
): Promise<{ success: boolean; message: string }> {
  return callFunction("updateSalaireStatut", { salaireId, statut, datePaiement });
}

// Stats
export function getComptaStatsSecure(
  mois?: string
): Promise<{ success: boolean; stats: ComptaStats }> {
  return callFunction("getComptaStats", { mois });
}
