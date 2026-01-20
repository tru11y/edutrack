import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Eleve } from "./eleve.types";

export async function getElevesEligibles(): Promise<Eleve[]> {
  const snap = await getDocs(collection(db, "eleves"));

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Eleve))
    .filter((e) => !e.isBanned && e.statut === "actif");
}
