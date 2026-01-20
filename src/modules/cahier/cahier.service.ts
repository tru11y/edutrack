import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

const cahierRef = collection(db, "cahiers");

export async function saveCahierTexte(payload: {
  professeurId: string;
  classes: string[];
  eleves: string[];
  contenu: string;
  devoirs?: string;
  date: string;
}) {
  await addDoc(cahierRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}
