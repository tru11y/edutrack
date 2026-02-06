import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { notifyAdmin } from "../notifications/alert.service";
import type { Eleve } from "./eleve.types";

export async function unbanEleveIfPaid(eleveId: string, mois: string) {
  const ref = doc(db, "eleves", eleveId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const eleve = snap.data() as Pick<Eleve, "isBanned" | "nom" | "prenom">;

  if (!eleve.isBanned) return;

  await updateDoc(ref, {
    isBanned: false,
    banReason: null,
    banDate: null,
    updatedAt: serverTimestamp(),
  });

  await notifyAdmin({
    type: "ban",
    eleveId,
    message: `Élève ${eleve.nom} ${eleve.prenom} débanni après paiement du mois ${mois}`,
  });
}
