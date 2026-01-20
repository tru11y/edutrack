import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { CahierTexteEntry } from "./cahier.types";

const cahierRef = collection(db, "cahierTexte");

/* =========================
   CREATE / UPSERT
========================= */

export async function saveCahierEntry(entry: CahierTexteEntry) {
  // Anti-doublon : même cours + même date + même classe
  const q = query(
    cahierRef,
    where("coursId", "==", entry.coursId),
    where("date", "==", entry.date),
    where("classe", "==", entry.classe)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    // déjà existant → on ignore (ou on peut update plus tard)
    return;
  }

  await addDoc(cahierRef, {
    ...entry,
    createdAt: serverTimestamp(),
  });
}

/* =========================
   READERS
========================= */

export async function getCahierByClasse(classe: string) {
  const q = query(cahierRef, where("classe", "==", classe));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

export async function getCahierByCours(coursId: string) {
  const q = query(cahierRef, where("coursId", "==", coursId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}
