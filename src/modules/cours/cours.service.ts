import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Cours } from "./cours.types";

const coursRef = collection(db, "cours");

/* ADMIN */

export async function getAllCours(): Promise<Cours[]> {
  const snap = await getDocs(coursRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Cours[];
}

export async function getCoursById(id: string): Promise<Cours | null> {
  const ref = doc(db, "cours", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Cours;
}

/* PROF */

export async function getCoursByProfesseur(professeurId: string) {
  const q = query(
    coursRef,
    where("professeurId", "==", professeurId)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

/* CREATE */

export async function createCours(data: Cours) {
  await addDoc(coursRef, {
    ...data,
    statut: "planifie",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* UPDATE */

export async function updateCours(id: string, data: Partial<Cours>) {
  const ref = doc(db, "cours", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
