import { serverTimestamp } from "firebase/firestore";
import { updateEleve } from "./eleve.service";
import type { Eleve } from "./eleve.types";

export async function banEleve(eleveId: string) {
  await updateEleve(eleveId, {
    isBanned: true,
    banReason: "Non paiement",
    banDate: serverTimestamp() as Eleve["banDate"],
  });
}
