import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { PresenceItem } from "./presence.types";

export async function ajouterEleveAPresence(
  presenceDocId: string,
  presence: PresenceItem
) {
  const ref = doc(db, "presences", presenceDocId);

  await updateDoc(ref, {
    presences: arrayUnion(presence),
  });
}
