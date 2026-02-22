import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Eleve } from "./eleve.types";

export async function getElevesEligibles(schoolId?: string): Promise<Eleve[]> {
  const q = schoolId
    ? query(collection(db, "eleves"), where("schoolId", "==", schoolId))
    : collection(db, "eleves");
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Eleve))
    .filter((e) => !e.isBanned && e.statut === "actif");
}
