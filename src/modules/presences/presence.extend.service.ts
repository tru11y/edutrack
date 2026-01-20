import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Presence } from "./presence.types";

export async function ajouterEleveAPresence(
  presenceDocId: string,
  presence: Presence
) {
  const ref = doc(db, "presences", presenceDocId);

  await updateDoc(ref, {
    presences: arrayUnion(presence),
  });
}
