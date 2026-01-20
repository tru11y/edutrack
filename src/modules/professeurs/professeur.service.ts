import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Professeur } from "./professeur.types";

/* ======================
   COLLECTION
====================== */

const profRef = collection(db, "professeurs");

/* ======================
   READ
====================== */

/**
 * Tous les professeurs (ADMIN)
 */
export async function getAllProfesseurs(): Promise<Professeur[]> {
  const snap = await getDocs(profRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Professeur[];
}

/**
 * Professeur par ID (ADMIN / PROF)
 */
export async function getProfesseurById(
  id: string
): Promise<Professeur | null> {
  const ref = doc(db, "professeurs", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  } as Professeur;
}

/**
 * Professeur lié à un user Firebase (DASHBOARD PROF)
 */
export async function getProfesseurByUser(
  userId: string
): Promise<Professeur | null> {
  const q = query(profRef, where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docSnap = snap.docs[0];

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Professeur;
}

/* ======================
   CREATE
====================== */

export async function createProfesseur(
  userId: string,
  data: Omit<Professeur, "id" | "createdAt" | "updatedAt" | "statut">
) {
  await addDoc(profRef, {
    ...data,
    userId,
    statut: "actif",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ======================
   UPDATE
====================== */

export async function updateProfesseur(
  id: string,
  data: Partial<Professeur>
) {
  const ref = doc(db, "professeurs", id);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ======================
   SOFT DELETE
====================== */

export async function desactiverProfesseur(id: string) {
  const ref = doc(db, "professeurs", id);

  await updateDoc(ref, {
    statut: "inactif",
    updatedAt: serverTimestamp(),
  });
}
