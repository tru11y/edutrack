import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { PresenceCoursPayload } from "./presence.types";

const presencesRef = collection(db, "presences");

/* SAVE */

export async function savePresencesForCours(
  payload: PresenceCoursPayload
) {
  if (!payload.coursId || !payload.classe || !payload.date) {
    throw new Error("Payload présence invalide");
  }

  await addDoc(presencesRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

/* ADMIN */

export async function getPresencesByCours(coursId: string) {
  const q = query(presencesRef, where("coursId", "==", coursId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

export async function getAllPresences() {
  const snap = await getDocs(presencesRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

/* ELEVE */

export async function getPresenceHistoryForEleve(eleveId: string) {
  const snap = await getDocs(presencesRef);

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((p) =>
      p.presences?.some((x: any) => x.eleveId === eleveId)
    );
}
