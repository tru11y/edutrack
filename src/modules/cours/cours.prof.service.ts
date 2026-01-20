import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Cours } from "./cours.types";

const coursRef = collection(db, "cours");

export async function getCoursByProfesseur(
  professeurId: string
): Promise<Cours[]> {
  const q = query(coursRef, where("professeurId", "==", professeurId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Cours, "id">),
  }));
}
