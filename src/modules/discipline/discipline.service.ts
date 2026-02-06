import { doc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { updateEleveSystem } from "../eleves/eleve.service";
import type { DisciplineRecord } from "./discipline.types";
import type { Eleve } from "../eleves/eleve.types";

/* =========================
   EXCLURE / BANNIR UN ELEVE
========================= */

export async function exclureEleve(
  eleveId: string,
  reason: string,
  auteur?: string
): Promise<void> {
  // Bannissement officiel
  await updateEleveSystem(eleveId, {
    isBanned: true,
    banReason: reason,
    banDate: serverTimestamp() as Eleve["banDate"],
  });

  // 📝 Optionnel : log discipline
  const ref = doc(db, "discipline_logs", `${eleveId}_${Date.now()}`);

  await updateDoc(ref, {
    eleveId,
    reason,
    auteur: auteur || "professeur",
    createdAt: serverTimestamp(),
  }).catch(() => {
    // Si la collection n'existe pas encore → on ignore sans bloquer
  });
}

/* =========================
   GET ALL DISCIPLINE LOGS
========================= */

export async function getAllDiscipline(): Promise<DisciplineRecord[]> {
  try {
    const logsRef = collection(db, "discipline_logs");
    const snapshot = await getDocs(logsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DisciplineRecord, "id">),
    }));
  } catch {
    return [];
  }
}
