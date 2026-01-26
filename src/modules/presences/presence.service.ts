import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { PresenceCoursPayload, PresenceItem } from "./presence.types";

const presencesRef = collection(db, "presences");

interface PresenceDocument extends PresenceCoursPayload {
  id: string;
}

/* SAVE */

export async function savePresencesForCours(
  payload: PresenceCoursPayload
): Promise<void> {
  if (!payload.coursId || !payload.classe || !payload.date) {
    throw new Error("Payload présence invalide");
  }

  await addDoc(presencesRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

/* ADMIN */

export async function getPresencesByCours(coursId: string): Promise<PresenceDocument[]> {
  const q = query(presencesRef, where("coursId", "==", coursId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as PresenceCoursPayload),
  }));
}

export async function getAllPresences(): Promise<PresenceDocument[]> {
  const snap = await getDocs(presencesRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as PresenceCoursPayload),
  }));
}

/* ELEVE */

export async function getPresenceHistoryForEleve(eleveId: string): Promise<PresenceDocument[]> {
  const snap = await getDocs(presencesRef);

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as PresenceCoursPayload) }))
    .filter((p) =>
      p.presences?.some((x: PresenceItem) => x.eleveId === eleveId)
    );
}
