import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

export async function banEleveByProf(
  eleveId: string,
  reason: string = "Non paiement"
) {
  const ref = doc(db, "eleves", eleveId);

  await updateDoc(ref, {
    isBanned: true,
    banReason: reason,
    banDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
