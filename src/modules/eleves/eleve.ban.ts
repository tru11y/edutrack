import { serverTimestamp } from "firebase/firestore";
import { updateEleve } from "./eleve.service";

export async function banEleve(eleveId: string) {
  await updateEleve(eleveId, {
    isBanned: true,
    banReason: "Non paiement",
    banDate: serverTimestamp(),
  });
}
