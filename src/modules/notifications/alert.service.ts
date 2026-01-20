import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

const alertsRef = collection(db, "alerts");

export async function notifyAdmin(payload: {
  type: "paiement" | "presence" | "ban";
  eleveId: string;
  message: string;
}) {
  await addDoc(alertsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    seen: false,
  });
}
